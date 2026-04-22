# 💕 只属于我们的世界

一个私密的双人 App，专为你们两人设计。打开即可看到对方正在用什么 App、从几点开始用、停留了多久。

---

## 功能特性

- **实时活动同步**：通过 WebSocket 实时推送，对方打开/关闭 App 第一时间可见
- **活动时间线**：按时间顺序展示今日的所有应用使用记录（应用名、开始时间、结束时间、停留时长）
- **在线状态**：绿点显示对方是否在线，离线时显示"X 分钟前离线"
- **40+ 常用 App 图标**：微信、微博、抖音、原神、猫箱等常用 App 自动匹配 emoji 图标
- **自定义 App 名称**：手动输入任意 App 名记录
- **浪漫暗紫色 UI**：专为私密二人空间设计的视觉风格
- **配对码保护**：只有知道配对码才能进入，完全私密

---

## 快速启动（推荐：Docker）

```bash
cd couple-app
# 修改配对码（可选）
PAIR_CODE=你们的专属密码 docker-compose up -d
```

访问 `http://你的服务器IP:3001`

---

## 本地开发

**需要 Node.js 18+**

```bash
cd couple-app

# 安装依赖
cd server && npm install && cd ..
cd client && npm install && cd ..

# 启动后端（终端1）
cd server && node index.js

# 启动前端（终端2，仅开发模式需要）
cd client && npm run dev

# 访问 http://localhost:5173（开发）或 http://localhost:3001（生产）
```

---

## 生产部署

```bash
# 构建前端
cd client && npm run build

# 启动服务器（前端已嵌入）
cd ../server && node index.js
# 访问 http://localhost:3001
```

---

## 使用方法

1. **两人都访问同一个网址**
2. **各自输入自己的名字 + 配对码**（默认 `LOVEBIRDS`）
3. **点击"记录我正在用的 App"** → 从常用列表选择或手动输入
4. 对方的界面会**实时更新**，显示你打开了什么 App
5. 点击"管理"按钮关闭 App，记录自动计算停留时长

---

## 修改配对码

**Docker：**

```bash
PAIR_CODE=OURCODE123 docker-compose up -d
```

**直接运行：**

```bash
PAIR_CODE=OURCODE123 node index.js
```

---

## 技术架构

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite + Tailwind CSS |
| 后端 | Node.js + Express + ws（WebSocket） |
| 通信 | WebSocket 全双工实时推送 |
| 数据 | 内存存储（重启后重置） |
| 部署 | Docker / 直接 Node |

> **注意**：数据存储在内存中，服务器重启后会重置。如需持久化，可将 `users` 和 `activities` Map 替换为 SQLite 等轻量数据库。

---

## 隐私说明

- 没有第三方服务，数据完全在你们的服务器上
- 服务器重启后数据清空，不留痕迹
- 只有知道配对码的人才能进入（最多2人）
