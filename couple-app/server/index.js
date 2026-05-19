const express = require('express');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// ─── Config ────────────────────────────────────────────────────────
const PAIR_CODE   = process.env.PAIR_CODE   || 'LOVEBIRDS';
const JWT_SECRET  = process.env.JWT_SECRET  || (() => {
  // Warn if using default — must be overridden in production
  console.warn('[WARN] JWT_SECRET not set. Using insecure default. Set JWT_SECRET env var!');
  return 'change-me-in-production-' + Math.random().toString(36);
})();
const JWT_EXPIRY  = '30d';  // tokens valid for 30 days

// ─── Security middleware ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // SPA needs inline scripts
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,         // Restrict to your domain in production via ALLOWED_ORIGIN env
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));  // Hard-cap request body

// Rate limiting: 30 req/min per IP for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求太频繁，请稍后再试' },
});

// Strict limiter for the pair/login endpoint: 5 attempts/min
const pairLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: '尝试次数过多，请1分钟后再试' },
});

// ─── In-memory state ───────────────────────────────────────────────
// users Map: userId -> { name, ws, connected, lastSeen, deviceId }
const users = new Map();
// activities: userId -> [{ appName, startTime, endTime|null, duration|null }]
const activities = new Map();
// ws -> userId
const wsToUser = new WeakMap();

// ─── Helpers ───────────────────────────────────────────────────────
function broadcastToAll(payload, excludeWs = null) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === 1) client.send(msg);
  });
}

function getFullState() {
  const state = {};
  users.forEach((user, uid) => {
    state[uid] = {
      userId: uid,
      name: user.name,
      connected: user.connected,
      lastSeen: user.lastSeen,
      activities: (activities.get(uid) || []).slice(-50),
    };
  });
  return state;
}

function closeCurrentActivity(userId, atTime = null) {
  const list = activities.get(userId) || [];
  const current = list.find(a => a.endTime === null);
  if (current) {
    current.endTime = atTime || new Date().toISOString();
    current.duration = Math.round(
      (new Date(current.endTime) - new Date(current.startTime)) / 1000
    );
  }
  return current;
}

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

function extractBearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// ─── REST API ──────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../client/dist')));

/**
 * POST /api/pair
 * Body: { name, code }
 * Returns: { token, userId, name }
 *
 * The pair code acts as a shared secret between the two of you.
 * JWT is issued here and must be presented for all subsequent calls.
 */
app.post('/api/pair', pairLimiter, (req, res) => {
  const { name, code } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '请输入你的名字' });
  }
  if (code !== PAIR_CODE) {
    return res.status(403).json({ error: '配对码错误' });
  }

  const trimmed = name.trim().slice(0, 20);

  // Reuse userId if same name already registered; otherwise require < 2 users
  let userId = null;
  users.forEach((u, id) => { if (u.name === trimmed) userId = id; });

  if (!userId) {
    if (users.size >= 2) {
      return res.status(403).json({ error: '这个空间已有两人，无法加入' });
    }
    userId = uuidv4();
    users.set(userId, { name: trimmed, ws: null, connected: false, lastSeen: null });
    activities.set(userId, []);
  }

  const token = signToken(userId);
  res.json({ token, userId, name: trimmed });
});

/**
 * GET /api/state  (requires Bearer JWT)
 */
app.get('/api/state', apiLimiter, (req, res) => {
  const payload = verifyToken(extractBearer(req));
  if (!payload) return res.status(401).json({ error: '未授权' });
  res.json(getFullState());
});

/**
 * POST /api/activity/start  (requires Bearer JWT)
 * Body: { appName, startTime? }
 *
 * This is the endpoint the Android app calls automatically
 * when UsageStatsManager detects a foreground app change.
 */
app.post('/api/activity/start', apiLimiter, (req, res) => {
  const payload = verifyToken(extractBearer(req));
  if (!payload) return res.status(401).json({ error: '未授权' });

  const userId = payload.userId;
  if (!users.has(userId)) return res.status(404).json({ error: '用户不存在' });

  const { appName, startTime } = req.body || {};
  if (!appName || typeof appName !== 'string') {
    return res.status(400).json({ error: '缺少 appName' });
  }

  const safeApp  = appName.trim().slice(0, 50);
  const safeTime = startTime && !isNaN(Date.parse(startTime))
    ? startTime
    : new Date().toISOString();

  closeCurrentActivity(userId, safeTime);

  const list = activities.get(userId) || [];
  list.push({ appName: safeApp, startTime: safeTime, endTime: null, duration: null });
  activities.set(userId, list);

  const broadcastPayload = { type: 'activity_start', userId, appName: safeApp, startTime: safeTime };
  broadcastToAll(broadcastPayload);
  console.log(`[HTTP] ${users.get(userId).name} started "${safeApp}"`);

  res.json({ ok: true });
});

/**
 * POST /api/activity/end  (requires Bearer JWT)
 * Body: { endTime? }
 */
app.post('/api/activity/end', apiLimiter, (req, res) => {
  const payload = verifyToken(extractBearer(req));
  if (!payload) return res.status(401).json({ error: '未授权' });

  const userId = payload.userId;
  if (!users.has(userId)) return res.status(404).json({ error: '用户不存在' });

  const { endTime } = req.body || {};
  const safeTime = endTime && !isNaN(Date.parse(endTime)) ? endTime : null;
  const closed = closeCurrentActivity(userId, safeTime);

  broadcastToAll({ type: 'activity_end', userId, activity: closed });
  res.json({ ok: true, activity: closed });
});

// Fallback to React SPA
app.get('*', (req, res) => {
  const f = path.join(__dirname, '../client/dist/index.html');
  require('fs').existsSync(f) ? res.sendFile(f) : res.status(404).json({ error: 'Client not built' });
});

// ─── WebSocket (used by the web frontend) ─────────────────────────
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      // Web client authenticates via JWT in the auth message
      case 'auth': {
        const payload = verifyToken(msg.token);
        if (!payload || !users.has(payload.userId)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Token 无效，请重新配对' }));
          ws.close();
          return;
        }
        const userId = payload.userId;
        const user = users.get(userId);
        user.ws = ws;
        user.connected = true;
        user.lastSeen = new Date().toISOString();
        wsToUser.set(ws, userId);

        ws.send(JSON.stringify({ type: 'state', data: getFullState() }));
        broadcastToAll({ type: 'user_connected', userId, name: user.name }, ws);
        console.log(`[WS] ${user.name} connected`);
        break;
      }

      case 'activity_start': {
        const userId = wsToUser.get(ws);
        if (!userId) return;
        const { appName } = msg;
        if (!appName) return;
        const safeApp = String(appName).trim().slice(0, 50);

        closeCurrentActivity(userId);
        const list = activities.get(userId) || [];
        const startTime = new Date().toISOString();
        list.push({ appName: safeApp, startTime, endTime: null, duration: null });
        activities.set(userId, list);

        broadcastToAll({ type: 'activity_start', userId, appName: safeApp, startTime });
        break;
      }

      case 'activity_end': {
        const userId = wsToUser.get(ws);
        if (!userId) return;
        const closed = closeCurrentActivity(userId);
        broadcastToAll({ type: 'activity_end', userId, activity: closed });
        break;
      }

      case 'ping': {
        const userId = wsToUser.get(ws);
        if (userId && users.has(userId)) users.get(userId).lastSeen = new Date().toISOString();
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }

      default: break;
    }
  });

  ws.on('close', () => {
    const userId = wsToUser.get(ws);
    if (userId && users.has(userId)) {
      const user = users.get(userId);
      user.ws = null;
      user.connected = false;
      user.lastSeen = new Date().toISOString();
      closeCurrentActivity(userId);
      broadcastToAll({ type: 'user_disconnected', userId, name: user.name });
      console.log(`[WS] ${user.name} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n💕 Couple App Server on port ${PORT}`);
  console.log(`   Pair code : ${PAIR_CODE}`);
  console.log(`   JWT secret: ${JWT_SECRET === 'change-me-in-production-' + Math.random() ? '[default — set JWT_SECRET!]' : '[custom ✓]'}\n`);
});
