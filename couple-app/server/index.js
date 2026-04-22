const express = require('express');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// ─── In-memory state ───────────────────────────────────────────────
// One fixed pair room (2-person only)
const PAIR_CODE = process.env.PAIR_CODE || 'LOVEBIRDS';

// users: { userId -> { name, ws, connected, lastSeen } }
const users = new Map();

// activities: { userId -> [ { appName, startTime, endTime|null, duration|null } ] }
const activities = new Map();

// Connected WebSocket clients: ws -> userId
const wsToUser = new WeakMap();

// ─── Helpers ───────────────────────────────────────────────────────
function broadcastToAll(payload, excludeWs = null) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(msg);
    }
  });
}

function broadcastToUser(userId, payload) {
  const user = users.get(userId);
  if (user && user.ws && user.ws.readyState === 1) {
    user.ws.send(JSON.stringify(payload));
  }
}

function getFullState() {
  const state = {};
  users.forEach((user, uid) => {
    const userActivities = activities.get(uid) || [];
    state[uid] = {
      userId: uid,
      name: user.name,
      connected: user.connected,
      lastSeen: user.lastSeen,
      activities: userActivities.slice(-50), // last 50 entries
    };
  });
  return state;
}

function closeCurrentActivity(userId) {
  const list = activities.get(userId) || [];
  const current = list.find(a => a.endTime === null);
  if (current) {
    current.endTime = new Date().toISOString();
    current.duration = Math.round((new Date(current.endTime) - new Date(current.startTime)) / 1000);
  }
}

// ─── REST API ──────────────────────────────────────────────────────
// Serve built client (if present)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Verify pair code
app.post('/api/pair', (req, res) => {
  const { code, name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '请输入你的名字' });
  }
  if (code !== PAIR_CODE) {
    return res.status(403).json({ error: '配对码错误' });
  }
  if (users.size >= 2) {
    // Check if existing session with same name
    let existingId = null;
    users.forEach((u, id) => { if (u.name === name.trim()) existingId = id; });
    if (!existingId) {
      return res.status(403).json({ error: '房间已满（最多2人）' });
    }
  }
  // Reuse or create userId
  let userId = null;
  users.forEach((u, id) => { if (u.name === name.trim()) userId = id; });
  if (!userId) {
    userId = uuidv4();
    users.set(userId, { name: name.trim(), ws: null, connected: false, lastSeen: null });
    activities.set(userId, []);
  }
  res.json({ userId, name: name.trim(), pairCode: PAIR_CODE });
});

// Get current state
app.get('/api/state', (req, res) => {
  res.json(getFullState());
});

// Fallback to React app
app.get('*', (req, res) => {
  const distIndex = path.join(__dirname, '../client/dist/index.html');
  const fs = require('fs');
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.status(404).json({ error: 'Client not built yet' });
  }
});

// ─── WebSocket ─────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'auth': {
        const { userId } = msg;
        if (!users.has(userId)) {
          ws.send(JSON.stringify({ type: 'error', message: '用户不存在，请重新配对' }));
          return;
        }
        const user = users.get(userId);
        user.ws = ws;
        user.connected = true;
        user.lastSeen = new Date().toISOString();
        wsToUser.set(ws, userId);

        // Send full state to newly connected user
        ws.send(JSON.stringify({ type: 'state', data: getFullState() }));

        // Notify others
        broadcastToAll({ type: 'user_connected', userId, name: user.name }, ws);
        console.log(`[WS] ${user.name} (${userId}) connected`);
        break;
      }

      case 'activity_start': {
        const userId = wsToUser.get(ws);
        if (!userId) return;
        const { appName } = msg;
        if (!appName) return;

        closeCurrentActivity(userId);

        const list = activities.get(userId) || [];
        list.push({ appName, startTime: new Date().toISOString(), endTime: null, duration: null });
        activities.set(userId, list);

        const payload = { type: 'activity_start', userId, appName, startTime: list[list.length - 1].startTime };
        broadcastToAll(payload);
        console.log(`[Activity] ${users.get(userId)?.name} opened "${appName}"`);
        break;
      }

      case 'activity_end': {
        const userId = wsToUser.get(ws);
        if (!userId) return;
        closeCurrentActivity(userId);

        const list = activities.get(userId) || [];
        const last = list[list.length - 1];

        const payload = { type: 'activity_end', userId, activity: last };
        broadcastToAll(payload);
        console.log(`[Activity] ${users.get(userId)?.name} closed "${last?.appName}" (${last?.duration}s)`);
        break;
      }

      case 'ping': {
        const userId = wsToUser.get(ws);
        if (userId && users.has(userId)) {
          users.get(userId).lastSeen = new Date().toISOString();
        }
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }

      default:
        break;
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
  console.log(`\n💕 Couple App Server running on port ${PORT}`);
  console.log(`   Pair code: ${PAIR_CODE}\n`);
});
