import { useState } from 'react';

// Zar yüzlerindeki nokta pozisyonları [col, row] (0-2 aralığı, 3x3 grid üzerinde)
const PIPS = {
  1: [[1,1]],
  2: [[0,0],[2,2]],
  3: [[0,0],[1,1],[2,2]],
  4: [[0,0],[2,0],[0,2],[2,2]],
  5: [[0,0],[2,0],[1,1],[0,2],[2,2]],
  6: [[0,0],[2,0],[0,1],[2,1],[0,2],[2,2]],
};

export default function Dice({ value, rolling, disabled, onRoll }) {
  const pips = value ? PIPS[value] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Zar kutusu */}
      <div
        onClick={() => !disabled && !rolling && onRoll()}
        style={{
          width: '80px',
          height: '80px',
          background: 'white',
          borderRadius: '14px',
          boxShadow: disabled
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : rolling
              ? '0 0 30px rgba(99,102,241,0.8), 0 4px 20px rgba(0,0,0,0.4)'
              : '0 6px 0 #bbb, 0 8px 20px rgba(0,0,0,0.4)',
          cursor: disabled || rolling ? 'default' : 'pointer',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          padding: '10px',
          position: 'relative',
          transform: rolling ? 'none' : 'translateY(-2px)',
          transition: 'transform 0.1s, box-shadow 0.2s',
          animation: rolling ? 'zardon 0.6s ease-in-out infinite' : 'none',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {/* 3x3 grid noktalara */}
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const active = pips.some(([pc, pr]) => pc === col && pr === row);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {active && (
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#1e293b',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Zar At Butonu */}
      <button
        onClick={() => !disabled && !rolling && onRoll()}
        disabled={disabled || rolling}
        style={{
          padding: '10px 28px',
          fontSize: '15px',
          fontWeight: 'bold',
          background: disabled
            ? '#555'
            : 'linear-gradient(135deg, #6366f1, #4338ca)',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        {rolling ? '🎲 Atılıyor…' : '🎲 Zar At'}
      </button>

      <style>{`
        @keyframes zardon {
          0%   { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(-12deg) scale(1.05); }
          50%  { transform: rotate(12deg) scale(1.05); }
          75%  { transform: rotate(-8deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
