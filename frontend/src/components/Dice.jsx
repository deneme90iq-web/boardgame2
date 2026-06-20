import { useEffect, useRef } from 'react';

// ── Piyon noktaları (col, row) — 3x3 grid üzerinde ──
const PIPS = {
  1: [[1,1]],
  2: [[0,0],[2,2]],
  3: [[0,0],[1,1],[2,2]],
  4: [[0,0],[2,0],[0,2],[2,2]],
  5: [[0,0],[2,0],[1,1],[0,2],[2,2]],
  6: [[0,0],[2,0],[0,1],[2,1],[0,2],[2,2]],
};

// Zarı döndürüp hangi yüzün öne geleceği
// Zar yüzleri: ön=1, sağ=2, üst=3, alt=4, sol=5, arka=6
const CUBE_FACE_TRANSFORM = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateX(0deg) rotateY(-90deg)',
  3: 'rotateX(90deg) rotateY(0deg)',
  4: 'rotateX(-90deg) rotateY(0deg)',
  5: 'rotateX(0deg) rotateY(90deg)',
  6: 'rotateX(0deg) rotateY(180deg)',
};

// Döndükten sonra doğru yüze oturacak son transform (360 katı eklendi)
const FINAL_TRANSFORM = {
  1: 'rotateX(1080deg) rotateY(720deg)',
  2: 'rotateX(1080deg) rotateY(630deg)',   // 720 - 90
  3: 'rotateX(990deg)  rotateY(720deg)',   // 1080 - 90
  4: 'rotateX(1170deg) rotateY(720deg)',   // 1080 + 90
  5: 'rotateX(1080deg) rotateY(810deg)',   // 720 + 90
  6: 'rotateX(1080deg) rotateY(900deg)',   // 720 + 180
};

function Face({ value, style }) {
  const pips = PIPS[value] || [];
  return (
    <div style={{
      position: 'absolute', width: '90px', height: '90px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '14px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      padding: '10px',
      boxSizing: 'border-box',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      ...style,
    }}>
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const active = pips.some(([pc, pr]) => pc === col && pr === row);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {active && (
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #64748b, #0f172a)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Dice({ value, rolling, disabled, onRoll }) {
  const cubeRef = useRef(null);

  useEffect(() => {
    const el = cubeRef.current;
    if (!el) return;

    if (rolling) {
      // Döndürme animasyonu başlat
      el.style.transition = 'none';
      el.style.animation = 'zarDon 0.25s linear infinite';
    } else if (value) {
      // Animasyonu durdur, doğru yüze yumuşak geç
      el.style.animation = 'none';
      // requestAnimationFrame ile transition'ı etkinleştir
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        el.style.transform = FINAL_TRANSFORM[value] || FINAL_TRANSFORM[1];
      });
    }
  }, [rolling, value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
      {/* Zar konteyneri — 3D perspektif */}
      <div style={{ perspective: '400px' }}>
        <div
          ref={cubeRef}
          style={{
            width: '90px', height: '90px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: value ? FINAL_TRANSFORM[value] : CUBE_FACE_TRANSFORM[1],
          }}
        >
          {/* 6 yüz */}
          <Face value={1} style={{ transform: 'translateZ(45px)' }} />
          <Face value={2} style={{ transform: 'rotateY(-90deg) translateZ(45px)' }} />
          <Face value={3} style={{ transform: 'rotateX(90deg) translateZ(45px)' }} />
          <Face value={4} style={{ transform: 'rotateX(-90deg) translateZ(45px)' }} />
          <Face value={5} style={{ transform: 'rotateY(90deg) translateZ(45px)' }} />
          <Face value={6} style={{ transform: 'rotateY(180deg) translateZ(45px)' }} />
        </div>
      </div>

      {/* Zar At Butonu */}
      <button
        onClick={() => !disabled && !rolling && onRoll()}
        disabled={disabled || rolling}
        style={{
          padding: '10px 30px', fontSize: '15px', fontWeight: 'bold',
          background: disabled
            ? 'rgba(80,80,80,0.5)'
            : 'linear-gradient(135deg, #6366f1, #4338ca)',
          opacity: disabled ? 0.5 : 1,
          boxShadow: disabled ? 'none' : '0 4px 15px rgba(99,102,241,0.4)',
          letterSpacing: '0.5px',
          transition: 'all 0.2s',
        }}
      >
        {rolling ? '⏳ Atılıyor…' : '🎲 Zar At'}
      </button>

      <style>{`
        @keyframes zarDon {
          0%   { transform: rotateX(0deg)   rotateY(0deg)   rotateZ(0deg); }
          33%  { transform: rotateX(180deg) rotateY(120deg) rotateZ(60deg); }
          66%  { transform: rotateX(90deg)  rotateY(240deg) rotateZ(30deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(90deg); }
        }
      `}</style>
    </div>
  );
}
