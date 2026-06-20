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

const COLORS = {
  red: '#ef4444',
  green: '#10b981',
  yellow: '#eab308',
  blue: '#3b82f6'
};

export default function LudoBoard({ roomState, onMove }) {
  const pawns = roomState?.pawns || {
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1]
  };

  const getPawnPosition = (color, pos) => {
    if (pos === -1) {
      // In base
      return null;
    }
    if (pos >= 0 && pos <= 51) {
      // On track
      const trackIndex = (START_INDEX[color] + pos) % 52;
      return PATH[trackIndex];
    }
    if (pos >= 100 && pos <= 104) {
      // In home stretch
      return HOME_PATHS[color][pos - 100];
    }
    return null; // Finished
  };

  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      let bgColor = 'transparent';
      let border = '1px solid rgba(255,255,255,0.05)';
      
      // Draw bases
      if (r < 6 && c < 6) bgColor = 'rgba(239, 68, 68, 0.1)';
      if (r < 6 && c > 8) bgColor = 'rgba(16, 185, 129, 0.1)';
      if (r > 8 && c > 8) bgColor = 'rgba(234, 179, 8, 0.1)';
      if (r > 8 && c < 6) bgColor = 'rgba(59, 130, 246, 0.1)';

      // Draw safe spots
      if (r === 6 && c === 1) bgColor = 'rgba(239, 68, 68, 0.3)';
      if (r === 1 && c === 8) bgColor = 'rgba(16, 185, 129, 0.3)';
      if (r === 8 && c === 13) bgColor = 'rgba(234, 179, 8, 0.3)';
      if (r === 13 && c === 6) bgColor = 'rgba(59, 130, 246, 0.3)';

      // Draw home paths
      HOME_PATHS.red.forEach(([hr, hc]) => { if (r === hr && c === hc) bgColor = 'rgba(239, 68, 68, 0.2)' });
      HOME_PATHS.green.forEach(([hr, hc]) => { if (r === hr && c === hc) bgColor = 'rgba(16, 185, 129, 0.2)' });
      HOME_PATHS.yellow.forEach(([hr, hc]) => { if (r === hr && c === hc) bgColor = 'rgba(234, 179, 8, 0.2)' });
      HOME_PATHS.blue.forEach(([hr, hc]) => { if (r === hr && c === hc) bgColor = 'rgba(59, 130, 246, 0.2)' });

      // Draw Center
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
        bgColor = 'rgba(255,255,255,0.05)';
      }

      cells.push({ r, c, bgColor, border });
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(15, 25px)',
        gridTemplateRows: 'repeat(15, 25px)',
        gap: '2px',
        background: 'var(--glass-bg)',
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        position: 'relative'
      }}>
        {cells.map((cell, i) => (
          <div key={i} style={{
            gridRow: cell.r + 1,
            gridColumn: cell.c + 1,
            backgroundColor: cell.bgColor,
            border: cell.border,
            borderRadius: '4px'
          }} />
        ))}

        {/* Draw Pawns */}
        {Object.entries(pawns).map(([color, positions]) => 
          positions.map((pos, idx) => {
            let pr, pc;
            if (pos === -1) {
              pr = BASE_POSITIONS[color][idx][0];
              pc = BASE_POSITIONS[color][idx][1];
            } else {
              const coord = getPawnPosition(color, pos);
              if (!coord) return null; // Finished
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
                  width: '80%',
                  height: '80%',
                  margin: '10%',
                  backgroundColor: COLORS[color],
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 2px 2px rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.3s ease',
                  border: '2px solid rgba(255,255,255,0.8)'
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
