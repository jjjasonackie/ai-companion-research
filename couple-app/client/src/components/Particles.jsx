import React, { useMemo } from 'react';

export default function Particles() {
  const particles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${4 + Math.random() * 8}px`,
      duration: `${12 + Math.random() * 20}s`,
      delay: `-${Math.random() * 20}s`,
      color: i % 3 === 0 ? '#e879a4' : i % 3 === 1 ? '#a78bfa' : '#fb7185',
    }));
  }, []);

  return (
    <div className="particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
