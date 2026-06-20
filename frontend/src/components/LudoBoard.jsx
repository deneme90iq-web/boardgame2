import React from 'react';

const PATH = [
  // Red start path (Sol orta üst)
  [6,1], [6,2], [6,3], [6,4], [6,5], 
  // Up towards Green
  [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
  [0,7], // Turn Right
  // Down from Green
  [0,8], [1,8], [2,8], [3,8], [4,8], [5,8],
  // Right towards Yellow
  [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
  [7,14], // Turn Down
  // Left from Yellow
  [8,14], [8,13], [8,12], [8,11], [8,10], [8,9],
  // Down towards Blue
  [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
  [14,7], // Turn Left
  // Up from Blue
  [14,6], [13,6], [12,6], [11,6], [10,6], [9,6],
  // Left towards Red
  [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
  [7,0], // Turn Up, closing the loop
  [6,0]
];

const HOME_PATHS = {
  red: [[7,1], [7,2], [7,3], [7,4], [7,5]],
  green: [[1,7], [2,7], [3,7], [4,7], [5,7]],
  yellow: [[7,13], [7,12], [7,11], [7,10], [7,9]],
  blue: [[13,7], [12,7], [11,7], [10,7], [9,7]]
};

// Piyonların kale içindeki 15x15 grid koordinatları
const BASE_POSITIONS = {
  red: [[2,2], [2,3], [3,2], [3,3]],
  green: [[2,11], [2,12], [3,11], [3,12]],
  yellow: [[11,11], [11,12], [12,11], [12,12]],
  blue: [[11,2], [11,3], [12,2], [12,3]]
};

const START_INDEX = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

const START_CELLS = {
  red: [6, 1],
  green: [1, 8],
  yellow: [8, 13],
  blue: [13, 6]
};

const COLORS = {
  red: '#0ea5e9',    // Resimde sol üst MAVİ
  green: '#facc15',  // Resimde sağ üst SARI
  yellow: '#16a34a', // Resimde sağ alt YEŞİL
  blue: '#ea580c'    // Resimde sol alt TURUNCU
};

export default function LudoBoard({ roomState, onMove }) {
  const pawns = roomState?.pawns || {
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1]
  };

  const getPawnPosition = (color, pos) => {
    if (pos === -1) return null;
    if (pos >= 0 && pos <= 51) {
      const trackIndex = (START_INDEX[color] + pos) % 52;
      return PATH[trackIndex];
    }
    if (pos >= 100 && pos <= 104) {
      return HOME_PATHS[color][pos - 100];
    }
    return null;
  };

  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      let isTrack = PATH.some(([pr, pc]) => pr === r && pc === c);
      let homeColor = null;
      let startColor = null;

      Object.entries(HOME_PATHS).forEach(([color, path]) => {
        if (path.some(([hr, hc]) => hr === r && hc === c)) homeColor = color;
      });

      Object.entries(START_CELLS).forEach(([color, [sr, sc]]) => {
        if (sr === r && sc === c) startColor = color;
      });

      if (isTrack || homeColor) {
        cells.push({ r, c, isTrack, homeColor, startColor });
      }
    }
  }

  // Kale içindeki boş beyaz yuvalar
  const baseSlots = [];
  Object.keys(BASE_POSITIONS).forEach(color => {
    BASE_POSITIONS[color].forEach(([r, c]) => {
      baseSlots.push({ r, c });
    });
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
      <div style={{
        width: '420px',
        height: '420px',
        backgroundColor: '#e6cda3',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 4px)',
        position: 'relative',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '4px solid #b8935d',
        overflow: 'hidden'
      }}>
        
        {/* PARK ALANI Yazıları */}
        <div style={{ position: 'absolute', top: '15px', left: '15px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>PARK ALANI</div>
        <div style={{ position: 'absolute', top: '15px', right: '15px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>PARK ALANI</div>
        <div style={{ position: 'absolute', bottom: '15px', left: '15px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>PARK ALANI</div>
        <div style={{ position: 'absolute', bottom: '15px', right: '15px', fontWeight: 'bold', fontSize: '14px', color: '#333' }}>PARK ALANI</div>

        {/* CSS Grid (Tüm tahtayı ve kaleleri tek grid üzerinden oturtuyoruz) */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 26px)',
          gridTemplateRows: 'repeat(15, 26px)',
          gap: '2px',
          width: 'max-content',
          height: 'max-content'
        }}>
          
          {/* Büyük Kaleler (Grid Row/Col Span kullanarak) */}
          <div style={{ gridArea: '1 / 1 / 7 / 7', backgroundColor: COLORS.red, borderRadius: '50%', border: '2px solid #333', transform: 'scale(0.85)' }} />
          <div style={{ gridArea: '1 / 10 / 7 / 16', backgroundColor: COLORS.green, borderRadius: '50%', border: '2px solid #333', transform: 'scale(0.85)' }} />
          <div style={{ gridArea: '10 / 1 / 16 / 7', backgroundColor: COLORS.blue, borderRadius: '50%', border: '2px solid #333', transform: 'scale(0.85)' }} />
          <div style={{ gridArea: '10 / 10 / 16 / 16', backgroundColor: COLORS.yellow, borderRadius: '50%', border: '2px solid #333', transform: 'scale(0.85)' }} />

          {/* Kale İçindeki Boş Beyaz Daireler */}
          {baseSlots.map((slot, i) => (
            <div key={`slot-${i}`} style={{
              gridRow: slot.r + 1,
              gridColumn: slot.c + 1,
              backgroundColor: 'white',
              borderRadius: '50%',
              border: '1px solid #999',
              zIndex: 2,
              transform: 'scale(0.9)'
            }} />
          ))}

          {/* Yollar ve Evler */}
          {cells.map((cell, i) => (
            <div key={`cell-${i}`} style={{
              gridRow: cell.r + 1,
              gridColumn: cell.c + 1,
              backgroundColor: cell.homeColor ? COLORS[cell.homeColor] : 'white',
              border: '1px solid #666',
              borderRadius: '50%',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 3
            }}>
              {/* Başlangıç okları */}
              {cell.startColor && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  color: COLORS[cell.startColor], fontSize: '18px', fontWeight: 'bold'
                }}>
                  {cell.startColor === 'red' ? '➔' : cell.startColor === 'green' ? '⬇' : cell.startColor === 'yellow' ? '⬅' : '⬆'}
                </div>
              )}
            </div>
          ))}

          {/* Piyonlar */}
          {Object.entries(pawns).map(([color, positions]) => 
            positions.map((pos, idx) => {
              let pr, pc;
              if (pos === -1) {
                pr = BASE_POSITIONS[color][idx][0];
                pc = BASE_POSITIONS[color][idx][1];
              } else {
                const coord = getPawnPosition(color, pos);
                if (!coord) return null;
                pr = coord[0];
                pc = coord[1];
              }

              return (
                <div 
                  key={`${color}-${idx}`}
                  onClick={() => onMove(color, idx)}
                  style={{
                    gridRow: pr + 1,
                    gridColumn: pc + 1,
                    width: '20px',
                    height: '20px',
                    justifySelf: 'center',
                    alignSelf: 'center',
                    backgroundColor: COLORS[color],
                    borderRadius: '50%',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(0,0,0,0.2)'
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
