import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import UserCard from '../components/UserCard.jsx';
import LogActivityModal from '../components/LogActivityModal.jsx';
import Particles from '../components/Particles.jsx';
import { getAppIcon } from '../utils/appIcons.js';
import { formatTime } from '../utils/time.js';

// ── State ──────────────────────────────────────────────────────────
function stateReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE': return action.data;

    case 'USER_CONNECTED': {
      const next = { ...state };
      if (next[action.userId]) {
        next[action.userId] = { ...next[action.userId], connected: true };
      }
      return next;
    }

    case 'USER_DISCONNECTED': {
      const next = { ...state };
      if (next[action.userId]) {
        next[action.userId] = { ...next[action.userId], connected: false, lastSeen: new Date().toISOString() };
      }
      return next;
    }

    case 'ACTIVITY_START': {
      const next = { ...state };
      if (!next[action.userId]) return next;
      const acts = next[action.userId].activities.map(a =>
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
      const acts = next[action.userId].activities.map(a =>
        a.endTime === null ? action.activity : a
      );
      next[action.userId] = { ...next[action.userId], activities: acts };
      return next;
    }

    default: return state;
  }
}

// ── Notifications ──────────────────────────────────────────────────
function useNotifications() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, icon = '💕') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return { toasts, addToast };
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { userId, myName, logout } = useApp();
  const [pairState, dispatch] = useReducer(stateReducer, {});
  const [showModal, setShowModal] = useState(false);
  const { toasts, addToast } = useNotifications();

  // Fetch initial state
  useEffect(() => {
    fetch('/api/state')
      .then(r => r.json())
      .then(data => dispatch({ type: 'SET_STATE', data }))
      .catch(() => {});
  }, []);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'state':
        dispatch({ type: 'SET_STATE', data: msg.data });
        break;

      case 'user_connected':
        dispatch({ type: 'USER_CONNECTED', userId: msg.userId });
        if (msg.userId !== userId) {
          addToast(`${msg.name} 上线了`, '💚');
        }
        break;

      case 'user_disconnected':
        dispatch({ type: 'USER_DISCONNECTED', userId: msg.userId });
        if (msg.userId !== userId) {
          addToast(`${msg.name} 离线了`, '💤');
        }
        break;

      case 'activity_start':
        dispatch({ type: 'ACTIVITY_START', userId: msg.userId, appName: msg.appName, startTime: msg.startTime });
        if (msg.userId !== userId) {
          addToast(`打开了 ${getAppIcon(msg.appName)} ${msg.appName}`, '👀');
        }
        break;

      case 'activity_end':
        dispatch({ type: 'ACTIVITY_END', userId: msg.userId, activity: msg.activity });
        break;

      default:
        break;
    }
  }, [userId, addToast]);

  const { connected, send } = useWebSocket(userId, handleMessage);

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

  const waitingForPartner = !partnerData;

  return (
    <div className="relative min-h-screen">
      <Particles />

      {/* Toasts */}
      <div className="fixed top-4 right-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm slide-up"
            style={{ background: '#221535', border: '1px solid #3d2a5a', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          >
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
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: connected ? '#4ade80' : '#6b7280', boxShadow: connected ? '0 0 6px #4ade80' : 'none' }}
              />
              <span className="text-xs" style={{ color: '#9d7cbf' }}>
                {connected ? '已连接' : '连接中...'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: '#1a1128', color: '#6b5a84', border: '1px solid #2a1e40' }}
          >
            退出
          </button>
        </div>

        {/* Partner card */}
        {waitingForPartner ? (
          <div className="card text-center py-10 mb-4">
            <div className="text-4xl mb-3 heartbeat">💝</div>
            <p className="font-medium mb-1">等待另一半加入</p>
            <p className="text-sm" style={{ color: '#9d7cbf' }}>
              让 TA 使用相同的配对码进入
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-xs mb-2 px-1" style={{ color: '#6b5a84' }}>TA 的状态</p>
            <UserCard userData={partnerData} isMe={false} />
          </div>
        )}

        {/* My card */}
        <div className="mb-6">
          <p className="text-xs mb-2 px-1" style={{ color: '#6b5a84' }}>我的状态</p>
          <UserCard userData={myData} isMe={true} />
        </div>

        {/* Log activity button */}
        <div className="sticky bottom-6">
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center justify-center gap-2 shadow-lg"
            style={{ boxShadow: '0 4px 24px rgba(232,121,164,0.3)' }}
          >
            {myCurrentActivity ? (
              <>
                <span>{getAppIcon(myCurrentActivity.appName)}</span>
                <span>正在用 {myCurrentActivity.appName} · 点击管理</span>
              </>
            ) : (
              <>
                <span>📱</span>
                <span>记录我正在用的 App</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal */}
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
