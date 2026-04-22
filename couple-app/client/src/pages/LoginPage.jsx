import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Particles from '../components/Particles.jsx';

export default function LoginPage() {
  const { login } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('请填写名字和配对码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '连接失败');
      } else {
        login(data.userId, data.name);
      }
    } catch {
      setError('无法连接服务器，请检查网络');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
      <Particles />

      <div className="relative z-10 w-full max-w-sm slide-up">
        {/* Heart logo */}
        <div className="text-center mb-8">
          <div className="text-6xl heartbeat inline-block mb-4">💕</div>
          <h1 className="text-2xl font-semibold glow-text">只属于我们的世界</h1>
          <p className="text-sm mt-2" style={{ color: '#9d7cbf' }}>
            一个私密的二人空间
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#c4b5d4' }}>
                你的名字
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="告诉我你是谁..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#c4b5d4' }}>
                配对码
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="输入我们的专属密码..."
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={30}
              />
              <p className="text-xs mt-1.5" style={{ color: '#6b5a84' }}>
                默认配对码：LOVEBIRDS（可在服务器设置中修改）
              </p>
            </div>

            {error && (
              <p className="text-sm text-center py-2 px-3 rounded-lg"
                 style={{ background: '#3d1a2a', color: '#fb7185' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary mt-2"
              disabled={loading}
            >
              {loading ? '连接中...' : '进入我们的世界 ✨'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#4d3870' }}>
          仅你们二人可进入 · 端对端私密
        </p>
      </div>
    </div>
  );
}
