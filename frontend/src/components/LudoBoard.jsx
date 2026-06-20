import React from 'react';

// ============================================================
// Renk eşlemesi — referans görselle aynı
// game key  → görsel renk
// red    → Kırmızı (sol üst)
// green  → Mavi    (sağ üst)
// yellow → Yeşil   (sağ alt)
// blue   → Sarı    (sol alt)
// ============================================================
export const CLR = {
  red:    '#ef4444',
  green:  '#3b82f6',
  yellow: '#22c55e',
  blue:   '#eab308',
};

const CLR_BORDER = {
  red:    '#b91c1c',
  green:  '#1d4ed8',
  yellow: '#15803d',
  blue:   '#a16207',
};

const C = 32;            // Hücre boyutu (px)
const R_TRACK = 12;      // Yol hücresi yarıçapı
const R_BASE  = 14;      // Kale yuvası yarıçapı
const B = 15 * C;        // Tahta toplam boyutu = 480px

// 52 hücreli ana yol [satır, sütun]
const TRACK = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
  [6,0],
];

// Ev koridoru [satır, sütun] — 0. indis dışa yakın
const HOME = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7]],
};

// Kale piyonu yuvaları [satır, sütun]
const BASE_SLOTS = {
  red:    [[2,2],[2,3],[3,2],[3,3]],
  green:  [[2,11],[2,12],[3,11],[3,12]],
  yellow: [[11,11],[11,12],[12,11],[12,12]],
  blue:   [[11,2],[11,3],[12,2],[12,3]],
};

const COLOR_START_ABS = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const TRACK_MAP = {};
TRACK.forEach(([r, c], i) => { TRACK_MAP[`${r},${c}`] = i; });

function cx(col) { return col * C + C / 2; }
function cy(row) { return row * C + C / 2; }

function getPawnCell(color, pos, idx) {
  if (pos === -1) return BASE_SLOTS[color][idx];
  if (pos >= 0 && pos <= 51) {
    const abs = (COLOR_START_ABS[color] + pos) % 52;
    return TRACK[abs];
  }
  if (pos >= 100 && pos <= 104) return HOME[color][pos - 100];
  return null;
}

function buildPawnMap(pawns) {
  const map = {};
  Object.entries(pawns).forEach(([color, positions]) => {
    positions.forEach((pos, idx) => {
      const cell = getPawnCell(color, pos, idx);
      if (!cell) return;
      const k = `${cell[0]},${cell[1]}`;
      if (!map[k]) map[k] = [];
      map[k].push({ color, idx, pos });
    });
  });
  return map;
}

// Birbirine komşu hücreler arasında bağlantı çizgileri
function makeLines(cells, closed = false) {
  const lines = [];
  for (let i = 0; i < cells.length - 1; i++) {
    lines.push({ r1: cells[i][0], c1: cells[i][1], r2: cells[i+1][0], c2: cells[i+1][1] });
  }
  if (closed && cells.length > 1) {
    lines.push({
      r1: cells[cells.length-1][0], c1: cells[cells.length-1][1],
      r2: cells[0][0], c2: cells[0][1]
    });
  }
  return lines;
}

// ============================================================
export default function LudoBoard({ roomState, playerColor, onMove }) {
  const pawns = roomState?.pawns || {
    red: [-1,-1,-1,-1], green: [-1,-1,-1,-1],
    yellow: [-1,-1,-1,-1], blue: [-1,-1,-1,-1],
  };
  const lastDice = roomState?.lastDice || 0;
  const turn = roomState?.turn;
  const movablePawns = roomState?.movablePawns || [];
  const isMyTurn = turn === playerColor;
  const canAct = isMyTurn && lastDice > 0;

  const pawnMap = buildPawnMap(pawns);

  // Bağlantı çizgileri
  const trackLines = makeLines(TRACK, true);
  const homeLines = Object.values(HOME).flatMap(cells => makeLines(cells));

  // Hücre tipi haritası
  function cellInfo(row, col) {
    const k = `${row},${col}`;
    if (row <= 5 && col <= 5) return { t: 'base', color: 'red' };
    if (row <= 5 && col >= 9) return { t: 'base', color: 'green' };
    if (row >= 9 && col >= 9) return { t: 'base', color: 'yellow' };
    if (row >= 9 && col <= 5) return { t: 'base', color: 'blue' };
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return { t: 'center' };
    if (row === 7 && col >= 1 && col <= 5) return { t: 'home', color: 'red' };
    if (col === 7 && row >= 1 && row <= 5) return { t: 'home', color: 'green' };
    if (row === 7 && col >= 9 && col <= 13) return { t: 'home', color: 'yellow' };
    if (col === 7 && row >= 9 && row <= 13) return { t: 'home', color: 'blue' };
    if (k in TRACK_MAP) {
      return { t: 'track', absIdx: TRACK_MAP[k], safe: SAFE_ABS.has(TRACK_MAP[k]) };
    }
    return { t: 'empty' };
  }

  // Tahta hücreleri
  const boardCells = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const info = cellInfo(row, col);
      if (info.t === 'empty' || info.t === 'base' || info.t === 'center') continue;

      const x = cx(col), y = cy(row);

      if (info.t === 'home') {
        boardCells.push(
          <circle key={`h${row},${col}`}
            cx={x} cy={y} r={R_TRACK}
            fill={CLR[info.color]} stroke={CLR_BORDER[info.color]} strokeWidth="1.5"
          />
        );
      } else if (info.t === 'track') {
        boardCells.push(
          <g key={`t${row},${col}`}>
            <circle cx={x} cy={y} r={R_TRACK} fill="white" stroke="#555" strokeWidth="1.5" />
            {info.safe && (
              <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fill="#f59e0b"
                style={{ userSelect: 'none' }}>★</text>
            )}
          </g>
        );
      }
    }
  }

  // Piyonlar
  const pawnEls = [];
  Object.values(pawnMap).forEach(pawnsHere => {
    const count = pawnsHere.length;
    const offsets = count > 1 ? [[-7,-7],[7,-7],[-7,7],[7,7]] : [[0,0]];
    pawnsHere.forEach((pw, pi) => {
      const cell = getPawnCell(pw.color, pw.pos, pw.idx);
      if (!cell) return;
      const [offX, offY] = offsets[Math.min(pi, offsets.length-1)];
      const px = cx(cell[1]) + offX;
      const py = cy(cell[0]) + offY;
      const pr = count > 1 ? 9 : 13;
      const isMovable = canAct && pw.color === playerColor && movablePawns.includes(pw.idx);

      pawnEls.push(
        <g key={`${pw.color}-${pw.idx}`}
          onClick={() => isMovable && onMove(pw.color, pw.idx)}
          style={{ cursor: isMovable ? 'pointer' : 'default' }}
        >
          {isMovable && (
            <circle cx={px} cy={py} r={pr + 5} fill="white" opacity="0.0">
              <animate attributeName="r" values={`${pr+3};${pr+9};${pr+3}`} dur="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1s" repeatCount="indefinite"/>
            </circle>
          )}
          {/* Gölge */}
          <circle cx={px+1} cy={py+2} r={pr} fill="rgba(0,0,0,0.25)" />
          {/* Gövde */}
          <circle cx={px} cy={py} r={pr} fill={CLR[pw.color]} stroke={CLR_BORDER[pw.color]} strokeWidth="1.5"/>
          {/* Parlaklık */}
          <circle cx={px - pr*0.3} cy={py - pr*0.3} r={pr*0.35} fill="white" opacity="0.4"/>
          {/* Seçilebilir kenarlık */}
          {isMovable && (
            <circle cx={px} cy={py} r={pr+2} fill="none" stroke="white" strokeWidth="2.5" opacity="0.9"/>
          )}
        </g>
      );
    });
  });

  // Merkez noktası
  const mid = `${cx(7)},${cy(7)}`;
  const corners = {
    tl: `${6*C},${6*C}`, tr: `${9*C},${6*C}`,
    bl: `${6*C},${9*C}`, br: `${9*C},${9*C}`,
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
      <svg width={B} height={B}
        style={{
          background: '#d4a96a',
          borderRadius: '6px',
          border: '4px solid #8b6332',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'block',
        }}
      >
        {/* Yol bağlantı çizgileri */}
        {trackLines.map((l, i) => (
          <line key={`tl${i}`} x1={cx(l.c1)} y1={cy(l.r1)} x2={cx(l.c2)} y2={cy(l.r2)}
            stroke="#555" strokeWidth="1.5" />
        ))}
        {homeLines.map((l, i) => (
          <line key={`hl${i}`} x1={cx(l.c1)} y1={cy(l.r1)} x2={cx(l.c2)} y2={cy(l.r2)}
            stroke="#555" strokeWidth="1.5" />
        ))}

        {/* Kale piyonu yuvaları (boş) */}
        {Object.entries(BASE_SLOTS).map(([color, slots]) =>
          slots.map(([r, c], i) => (
            <circle key={`bs-${color}-${i}`} cx={cx(c)} cy={cy(r)} r={R_BASE}
              fill={CLR[color]} stroke={CLR_BORDER[color]} strokeWidth="2" opacity="0.35" />
          ))
        )}

        {/* Tahta hücreleri */}
        {boardCells}

        {/* Merkez üçgenler */}
        <polygon points={`${corners.tl} ${corners.bl} ${mid}`} fill={CLR.red}    stroke="white" strokeWidth="1"/>
        <polygon points={`${corners.tl} ${corners.tr} ${mid}`} fill={CLR.green}  stroke="white" strokeWidth="1"/>
        <polygon points={`${corners.tr} ${corners.br} ${mid}`} fill={CLR.yellow} stroke="white" strokeWidth="1"/>
        <polygon points={`${corners.bl} ${corners.br} ${mid}`} fill={CLR.blue}   stroke="white" strokeWidth="1"/>
        <circle cx={cx(7)} cy={cy(7)} r={12} fill="white" opacity="0.85"/>
        <text x={cx(7)} y={cy(7)+5} textAnchor="middle" fontSize="14" fill="#555"
          style={{ userSelect: 'none' }}>★</text>

        {/* Piyonlar */}
        {pawnEls}
      </svg>
    </div>
  );
}
