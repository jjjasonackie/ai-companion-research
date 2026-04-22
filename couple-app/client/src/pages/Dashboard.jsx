import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import UserCard from '../components/UserCard.jsx';
import LogActivityModal from '../components/LogActivityModal.jsx';
import Particles from '../components/Particles.jsx';
import { getAppIcon } from '../utils/appIcons.js';

function AndroidSetupCard({ token }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  function copyToken() {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card mb-6" style={{ border: '1px solid rgba(167,139,250,0.25)' }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">🤖</span>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Android 自动追踪</p>
          <p className="text-xs leading-relaxed mb-2" style={{ color: '#9d7cbf' }}>
            安装配套 App 后，手机会自动上报正在使用的应用，无需手动记录。
          </p>
          <button
            onClick={() => setShow(!show)}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ background: '#2d1a5a', color: '#a78bfa' }}
          >
            {show ? '收起' : '查看配置步骤'}
          </button>

          {show && (
            <div className="mt-3 space-y-2 text-xs" style={{ color: '#9d7cbf' }}>
              <p className="font-medium" style={{ color: '#f3e8ff' }}>配置步骤：</p>
              <p>1. 从仓库 <code className="px-1 rounded" style={{ background: '#2a1e40', color: '#a78bfa' }}>android-app/</code> 目录用 Android Studio 构建 APK</p>
              <p>2. 安装后打开「只属于我们」App</p>
              <p>3. 按提示授权「使用情况访问权限」</p>
              <p>4. 填入服务器地址 + 复制下方 Token</p>
              <p>5. 点保存 — 之后切换应用自动同步 ✓</p>

              <div className="mt-3 p-2 rounded-lg" style={{ background: '#130d1f', border: '1px solid #2a1e40' }}>
                <p className="mb-1" style={{ color: '#6b5a84' }}>你的 JWT Token（点击复制）：</p>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-xs truncate"
                    style={{ color: '#a78bfa', wordBreak: 'break-all', whiteSpace: 'pre-wrap', fontSize: '10px' }}
                  >
                    {token}
                  </code>
                  <button
                    onClick={copyToken}
                    className="flex-shrink-0 px-2 py-1 rounded text-xs"
                    style={{ background: copied ? '#1a3d1a' : '#2d1a5a', color: copied ? '#4ade80' : '#a78bfa' }}
                  >
                    {copied ? '✓ 已复制' : '复制'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function stateReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE': return action.data;

    case 'USER_CONNECTED': {
      const next = { ...state };
      if (next[action.userId]) next[action.userId] = { ...next[action.userId], connected: true };
      return next;
    }

    case 'USER_DISCONNECTED': {
      const next = { ...state };
      if (next[action.userId]) next[action.userId] = { ...next[action.userId], connected: false, lastSeen: new Date().toISOString() };
      return next;
    }

    case 'ACTIVITY_START': {
      const next = { ...state };
      if (!next[action.userId]) return next;
      const acts = (next[action.userId].activities || []).map(a =>
        a.endTime === null
          ? { ...a, endTime: action.startTime, duration: Math.round((new Date(action.startTime) - new Date(a.startTime)) / 1000) }
          : a
      );
      acts.push({ appName: action.appName, startTime: action.startTime, endTime: null, duration: null });
      next[action.userId] = { ...next[action.userId], activities: acts };
      return next;
    }

    case 'ACTIVITY_END': {
      const next = { ...state };
      if (!next[action.userId] || !action.activity) return next;
      const acts = (next[action.userId].activities || []).map(a =>
        a.endTime === null ? action.activity : a
      );
      next[action.userId] = { ...next[action.userId], activities: acts };
      return next;
    }

    default: return state;
  }
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, icon = '💕') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, icon }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, add };
}

export default function Dashboard() {
  const { userId, myName, token, logout } = useApp();
  const [pairState, dispatch] = useReducer(stateReducer, {});
  const [showModal, setShowModal] = useState(false);
  const { toasts, add: addToast } = useToasts();

  // Fetch initial state with Bearer token
  useEffect(() => {
    fetch('/api/state', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) dispatch({ type: 'SET_STATE', data }); })
      .catch(() => {});
  }, [token]);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'state':
        dispatch({ type: 'SET_STATE', data: msg.data });
        break;
      case 'user_connected':
        dispatch({ type: 'USER_CONNECTED', userId: msg.userId });
        if (msg.userId !== userId) addToast(`${msg.name} 上线了`, '💚');
        break;
      case 'user_disconnected':
        dispatch({ type: 'USER_DISCONNECTED', userId: msg.userId });
        if (msg.userId !== userId) addToast(`${msg.name} 离线了`, '💤');
        break;
      case 'activity_start':
        dispatch({ type: 'ACTIVITY_START', userId: msg.userId, appName: msg.appName, startTime: msg.startTime });
        if (msg.userId !== userId) addToast(`打开了 ${getAppIcon(msg.appName)} ${msg.appName}`, '👀');
        break;
      case 'activity_end':
        dispatch({ type: 'ACTIVITY_END', userId: msg.userId, activity: msg.activity });
        break;
      default: break;
    }
  }, [userId, addToast]);

  const { connected, send } = useWebSocket(token, handleMessage);

  const myData = pairState[userId];
  const partnerData = Object.values(pairState).find(u => u.userId !== userId);
  const myCurrentActivity = myData?.activities?.find(a => !a.endTime);

  function handleOpenApp(appName) {
    send({ type: 'activity_start', appName });
    setShowModal(false);
  }

  function handleCloseApp() {
    send({ type: 'activity_end' });
    setShowModal(false);
  }

  return (
    <div className="relative min-h-screen">
      <Particles />

      {/* Toasts */}
      <div className="fixed top-4 right-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm slide-up"
               style={{ background: '#221535', border: '1px solid #3d2a5a', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <span>{t.icon}</span>
            <span style={{ color: '#f3e8ff' }}>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-sm mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div>
            <h1 className="text-lg font-semibold glow-text">只属于我们的世界 💕</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full"
                    style={{ background: connected ? '#4ade80' : '#6b7280', boxShadow: connected ? '0 0 6px #4ade80' : 'none' }} />
              <span className="text-xs" style={{ color: '#9d7cbf' }}>
                {connected ? '已连接' : '连接中...'}
              </span>
            </div>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: '#1a1128', color: '#6b5a84', border: '1px solid #2a1e40' }}>
            退出
          </button>
        </div>

        {/* Partner */}
        {!partnerData ? (
          <div className="card text-center py-10 mb-4">
            <div className="text-4xl mb-3 heartbeat">💝</div>
            <p className="font-medium mb-1">等待另一半加入</p>
            <p className="text-sm" style={{ color: '#9d7cbf' }}>让 TA 使用相同的配对码进入</p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-xs mb-2 px-1" style={{ color: '#6b5a84' }}>TA 的状态</p>
            <UserCard userData={partnerData} isMe={false} />
          </div>
        )}

        {/* Me */}
        <div className="mb-6">
          <p className="text-xs mb-2 px-1" style={{ color: '#6b5a84' }}>我的状态</p>
          <UserCard userData={myData} isMe={true} />
        </div>

        {/* Android 自动上报提示 */}
        <AndroidSetupCard token={token} />

        {/* Log button */}
        <div className="sticky bottom-6">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 4px 24px rgba(232,121,164,0.3)' }}>
            {myCurrentActivity ? (
              <><span>{getAppIcon(myCurrentActivity.appName)}</span><span>正在用 {myCurrentActivity.appName} · 点击管理</span></>
            ) : (
              <><span>📱</span><span>手动记录正在用的 App</span></>
            )}
          </button>
        </div>
      </div>

      {showModal && (
        <LogActivityModal
          onOpen={handleOpenApp}
          onClose={myCurrentActivity ? handleCloseApp : () => setShowModal(false)}
          currentActivity={myCurrentActivity}
        />
      )}
    </div>
  );
}
