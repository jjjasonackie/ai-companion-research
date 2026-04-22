import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = import.meta.env.VITE_WS_HOST || window.location.host;
  return `${proto}://${host}`;
})();

export function useWebSocket(userId, onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!userId) return;
    if (wsRef.current && wsRef.current.readyState < 2) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'auth', userId }));
      pingTimer.current = setInterval(() => {
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' }));
      }, 25000);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type !== 'pong') onMessageRef.current(msg);
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      clearInterval(pingTimer.current);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { connected, send };
}
