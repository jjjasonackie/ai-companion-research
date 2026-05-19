import React, { useState, useEffect } from 'react';
import { getAppIcon } from '../utils/appIcons.js';
import { formatRelative, liveDuration, formatDuration, formatDateTime } from '../utils/time.js';
import ActivityTimeline from './ActivityTimeline.jsx';

function LiveTimer({ startTime }) {
  const [secs, setSecs] = useState(() => liveDuration(startTime));
  useEffect(() => {
    const id = setInterval(() => setSecs(liveDuration(startTime)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return <span>{formatDuration(secs)}</span>;
}

export default function UserCard({ userData, isMe }) {
  const [expanded, setExpanded] = useState(false);

  if (!userData) return null;

  const { name, connected, lastSeen, activities = [] } = userData;
  const currentActivity = activities.find(a => !a.endTime);
  const recentActivities = activities.filter(a => a.endTime).slice(-5);
  const todayCount = activities.length;

  return (
    <div
      className="card"
      style={{
        border: isMe
          ? '1px solid rgba(167, 139, 250, 0.4)'
          : '1px solid rgba(232, 121, 164, 0.4)',
        background: isMe ? '#1d1430' : '#221535',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-medium relative"
            style={{
              background: isMe
                ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                : 'linear-gradient(135deg, #be185d, #e879a4)',
            }}
          >
            {name.charAt(0)}
            {/* Online indicator */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
              style={{
                background: connected ? '#4ade80' : '#6b7280',
                borderColor: '#221535',
                boxShadow: connected ? '0 0 6px #4ade80' : 'none',
              }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{name}</span>
              {isMe && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#2d1a5a', color: '#a78bfa' }}>
                  我
                </span>
              )}
            </div>
            <div className="text-xs" style={{ color: '#9d7cbf' }}>
              {connected
                ? '在线中'
                : lastSeen
                  ? `${formatRelative(lastSeen)}离线`
                  : '从未上线'}
            </div>
          </div>
        </div>

        {/* Today stats */}
        <div className="text-right">
          <div className="text-xs" style={{ color: '#6b5a84' }}>今日</div>
          <div className="font-semibold text-sm glow-text">{todayCount} 条</div>
        </div>
      </div>

      {/* Current Activity */}
      {currentActivity ? (
        <div
          className="rounded-xl p-3 mb-4 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(232,121,164,0.1), rgba(167,139,250,0.1))',
            border: '1px solid rgba(232,121,164,0.2)',
          }}
        >
          <span className="text-2xl">{getAppIcon(currentActivity.appName)}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{currentActivity.appName}</div>
            <div className="text-xs" style={{ color: '#9d7cbf' }}>
              正在使用 · <LiveTimer startTime={currentActivity.startTime} />
            </div>
          </div>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pulse 1.5s infinite' }}
          />
        </div>
      ) : (
        <div
          className="rounded-xl p-3 mb-4 flex items-center gap-3"
          style={{ background: '#130d1f', border: '1px solid #2a1e40' }}
        >
          <span className="text-xl opacity-40">📵</span>
          <span className="text-sm" style={{ color: '#4d3870' }}>
            {connected ? '未记录任何应用' : '不在线'}
          </span>
        </div>
      )}

      {/* Toggle timeline */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-sm py-1.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
        style={{ color: '#9d7cbf', background: 'transparent' }}
      >
        <span>{expanded ? '收起' : '查看今日记录'}</span>
        <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2a1e40' }}>
          <ActivityTimeline activities={activities} />
        </div>
      )}
    </div>
  );
}
