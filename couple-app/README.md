# 💕 只属于我们的世界

一个私密的双人 App，专为你们两人设计。**Android 端自动读取当前使用的应用**，无需手动记录——对方打开什么 App、几点开始、用了多久，实时可见。

---

## 工作原理

```
你的手机（Android App）
    └─ UsageStatsManager 每3秒读取前台应用
    └─ 应用切换时 → POST /api/activity/start（含 JWT Token）
           ↓
    你们的服务器（Node.js）
           ↓ WebSocket 广播
    TA 的手机（浏览器 / Android App）
    └─ 实时显示你打开了什么、用了多久
```

**数据流完全在你们自己的服务器上，不经过任何第三方。**

---

## 安全架构

| 层 | 机制 |
|---|---|
| 身份认证 | JWT（HS256，30天有效期），配对码只用一次换 Token |
| 传输 | HTTPS/WSS（建议用 Nginx 反向代理加 TLS） |
| 限流 | 配对接口 5次/分钟，API 30次/分钟（防暴力破解） |
| 请求大小 | Body 硬限制 10KB |
| 安全头 | Helmet.js（XSS、MIME 嗅探等防护） |
| 房间隔离 | 最多2人，第3人无法加入 |
| 数据隔离 | Android App SharedPreferences 私有模式，Token 不可被其他应用读取 |

**Android 端只读取「当前前台应用名称」，不读取：屏幕内容、键盘输入、位置、联系人、照片。**

---

## 部署服务器

### Docker（推荐）

```bash
cd couple-app

# 生成一个随机 JWT 密钥
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"  # 保存好这个值

# 启动
PAIR_CODE=你们的专属密码 JWT_SECRET=$JWT_SECRET docker-compose up -d
```

访问 `http://你的服务器IP:3001`

### 直接运行

```bash
cd couple-app/client && npm install && npm run build
cd ../server && npm install

PAIR_CODE=你们的密码 JWT_SECRET=随机长字符串 node index.js
```

### 加 HTTPS（强烈建议）

用 Nginx 反向代理 + Let's Encrypt 证书：

```nginx
server {
    listen 443 ssl;
    server_name love.yourname.com;

    ssl_certificate     /etc/letsencrypt/live/love.yourname.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/love.yourname.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # 支持 WebSocket
        proxy_set_header Host $host;
    }
}
```

---

## 配置 Android App

### 编译

1. 用 Android Studio 打开 `couple-app/android-app/`
2. `Build → Generate Signed APK` → 安装到手机

### 首次配置（2分钟）

1. 打开 App → 点「前往授权设置」
2. 找到「只属于我们」→ 开启「使用情况访问」权限
3. 回到 App，填入：
   - **服务器地址**：`https://love.yourname.com`（或 `http://IP:3001`）
   - **Token**：在网页端登录后，点「Android 自动追踪 → 查看配置步骤 → 复制 Token」
4. 点「保存并启动追踪」

之后每次切换应用，对方 3 秒内可见。开机自动启动。

---

## 使用方式

| 场景 | 操作 |
|---|---|
| 自动模式（推荐） | 安装 Android App，一次性授权后全自动 |
| 手动记录 | 在网页端点「手动记录正在用的 App」 |
| 查看对方 | 打开网页，实时看到对方的活动状态和时间线 |
| 通知 | 对方上线/打开新 App 时，网页端弹出提示 |

---

## 技术架构

```
couple-app/
├── server/                   # Node.js 后端
│   └── index.js              # Express + WebSocket + JWT + 限流
├── client/                   # React 18 前端
│   └── src/
│       ├── pages/            # LoginPage, Dashboard
│       ├── components/       # UserCard, ActivityTimeline, LogActivityModal
│       ├── hooks/            # useWebSocket（自动重连）
│       └── context/          # AppContext（JWT 持久化）
├── android-app/              # Android 原生 App
│   └── app/src/main/
│       ├── service/          # TrackerService（后台轮询）+ BootReceiver
│       ├── ui/               # SetupActivity（配置界面）
│       ├── api/              # ApiClient（JWT HTTP 请求）
│       └── util/             # AppNameResolver + Prefs
├── Dockerfile
└── docker-compose.yml
```

---

## 隐私说明

- 数据**只存在你们的服务器内存中**，服务重启自动清空
- Android App **只发送应用名称**，不收集任何其他数据
- Token **只存在设备私有存储**，其他 App 无法读取
- 没有任何第三方服务，没有统计，没有广告
