import React, { useState, useRef, useEffect } from 'react';
import { COMMON_APPS, getAppIcon } from '../utils/appIcons.js';

export default function LogActivityModal({ onOpen, onClose, currentActivity }) {
  const [custom, setCustom] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function selectApp(name) {
    onOpen(name);
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    if (custom.trim()) {
      onOpen(custom.trim());
      setCustom('');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 slide-up"
        style={{ background: '#1a1128', border: '1px solid #3d2a5a' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">记录应用活动</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{ background: '#2a1e40', color: '#9d7cbf' }}
          >
            ✕
          </button>
        </div>

        {/* Current activity close button */}
        {currentActivity && (
          <div
            className="rounded-xl p-3 mb-4 flex items-center justify-between"
            style={{ background: 'rgba(232,121,164,0.1)', border: '1px solid rgba(232,121,164,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{getAppIcon(currentActivity.appName)}</span>
              <div>
                <div className="text-sm font-medium">{currentActivity.appName}</div>
                <div className="text-xs" style={{ color: '#9d7cbf' }}>正在使用中</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: '#3d1a2a', color: '#fb7185' }}
            >
              关闭此应用
            </button>
          </div>
        )}

        {/* Custom input */}
        <form onSubmit={handleCustomSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="input-field flex-1"
              placeholder="输入应用名称..."
              value={custom}
              onChange={e => setCustom(e.target.value)}
              maxLength={30}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-medium text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #e879a4, #a78bfa)', color: 'white' }}
              disabled={!custom.trim()}
            >
              记录
            </button>
          </div>
        </form>

        {/* Common apps grid */}
        <p className="text-xs mb-2" style={{ color: '#6b5a84' }}>常用应用</p>
        <div className="grid grid-cols-4 gap-2">
          {COMMON_APPS.map(app => (
            <button
              key={app}
              onClick={() => selectApp(app)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors"
              style={{
                background: currentActivity?.appName === app ? 'rgba(232,121,164,0.15)' : '#130d1f',
                border: currentActivity?.appName === app ? '1px solid rgba(232,121,164,0.4)' : '1px solid transparent',
              }}
            >
              <span className="text-xl">{getAppIcon(app)}</span>
              <span className="text-xs truncate w-full text-center" style={{ color: '#9d7cbf' }}>
                {app}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
