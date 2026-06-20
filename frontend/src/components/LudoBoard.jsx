import React from 'react';

// ============================================================
// TAHTA GEOMETRİSİ
// ============================================================

const C = 30; // Hücre büyüklüğü (px)
const B = 15 * C; // Tahta boyutu = 450px

// Renklerin görsel karşılıkları (backend renk adı → görsel renk kodu)
const CLR = {
  red:    '#0ea5e9',  // Mavi (sol üst)
  green:  '#eab308',  // Sarı (sağ üst)
  yellow: '#16a34a',  // Yeşil (sağ alt)
  blue:   '#ea580c',  // Turuncu (sol alt)
};

const CLR_DARK = {
  red:    '#0284c7',
  green:  '#ca8a04',
  yellow: '#15803d',
  blue:   '#c2410c',
};

// 52 hücreli ana yol: [satır, sütun]
const TRACK = [
  [6,1],[6,2],[6,3],[6,4],[6,5],          // 0-4  Red çıkışı
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],    // 5-10 Sol sütun yukarı
  [0,7],                                  // 11   Üst orta
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],    // 12-17 Sağ sütun aşağı (Green girişi)
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],// 18-23 Sağ yatay
  [7,14],                                 // 24   Sağ orta
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],// 25-30 Sol yatay (Yellow girişi)
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],// 31-36 Alt sütun
  [14,7],                                 // 37   Alt orta
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],// 38-43 Sağ sütun yukarı (Blue girişi)
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],   // 44-49 Sol yatay
  [7,0],                                  // 50   Sol orta
  [6,0],                                  // 51   Red'e dönüş
];

// Ev koridoru hücreleri: [satır, sütun] — 0. indis = en dışta
const HOME = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7]],
};

// Kale içindeki piyon yuvaları
const BASE_SLOTS = {
  red:    [[2,2],[2,3],[3,2],[3,3]],
  green:  [[2,11],[2,12],[3,11],[3,12]],
  yellow: [[11,11],[11,12],[12,11],[12,12]],
  blue:   [[11,2],[11,3],[12,2],[12,3]],
};

const COLOR_START_ABS = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Hızlı arama tablosu: "satır,sütun" → yol indisi
const TRACK_MAP = {};
TRACK.forEach(([r, c], i) => { TRACK_MAP[`${r},${c}`] = i; });

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

function cx(col) { return col * C + C / 2; }
function cy(row) { return row * C + C / 2; }

function getPawnCell(color, pos, idx) {
  if (pos === -1) return BASE_SLOTS[color][idx];
  if (pos >= 0 && pos <= 51) {
    const abs = (COLOR_START_ABS[color] + pos) % 52;
    return TRACK[abs];
  }
  if (pos >= 100 && pos <= 104) return HOME[color][pos - 100];
  return null; // pos 105 = bitmiş
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

// ============================================================
// TAHTA RENDER
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
  const r = C / 2 - 2; // Hücre daire yarıçapı

  // --- Hücre tipleri ---
  const trackCells = [];
  const homeCells = [];

  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const k = `${row},${col}`;

      // Kale bölgesi — büyük daire tarafından kaplanacak
      if (row <= 5 && col <= 5) continue;
      if (row <= 5 && col >= 9) continue;
      if (row >= 9 && col >= 9) continue;
      if (row >= 9 && col <= 5) continue;

      // Merkez 3x3
      if (row >= 6 && row <= 8 && col >= 6 && col <= 8) continue;

      // Ev koridoru hücreleri
      const isRedHome   = row === 7 && col >= 1 && col <= 5;
      const isGreenHome = col === 7 && row >= 1 && row <= 5;
      const isYellowHome= row === 7 && col >= 9 && col <= 13;
      const isBlueHome  = col === 7 && row >= 9 && row <= 13;

      if (isRedHome || isGreenHome || isYellowHome || isBlueHome) {
        const homeColor = isRedHome ? 'red' : isGreenHome ? 'green' : isYellowHome ? 'yellow' : 'blue';
        homeCells.push({ row, col, color: homeColor });
        continue;
      }

      // Ana yol hücreleri
      if (k in TRACK_MAP) {
        const absIdx = TRACK_MAP[k];
        const isSafe = SAFE_ABS.has(absIdx);
        trackCells.push({ row, col, absIdx, isSafe });
      }
    }
  }

  // --- Piyonlar ---
  const pawnElements = [];
  Object.values(pawnMap).forEach((pawnsAtCell) => {
    const count = pawnsAtCell.length;
    // Birden fazla piyon aynı hücredeyse dağıt
    const offsets = count > 1
      ? [[-6,-6],[6,-6],[-6,6],[6,6]]
      : [[0,0]];

    pawnsAtCell.forEach((pawn, pi) => {
      const cell = getPawnCell(pawn.color, pawn.pos, pawn.idx);
      if (!cell) return;
      const [offX, offY] = offsets[pi] || [0, 0];
      const px = cx(cell[1]) + offX;
      const py = cy(cell[0]) + offY;
      const pr = count > 1 ? 8 : 11;
      const isMovable = canAct && pawn.color === playerColor && movablePawns.includes(pawn.idx);

      pawnElements.push(
        <g
          key={`${pawn.color}-${pawn.idx}`}
          onClick={() => isMovable && onMove(pawn.color, pawn.idx)}
          style={{ cursor: isMovable ? 'pointer' : 'default' }}
        >
          {/* Titreyen halka — hareket edilebilir piyonlarda */}
          {isMovable && (
            <circle cx={px} cy={py} r={pr + 5} fill="white" opacity="0.3">
              <animate
                attributeName="r"
                values={`${pr + 3};${pr + 8};${pr + 3}`}
                dur="1.2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.4;0.0;0.4"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
          {/* Piyon gölgesi */}
          <circle cx={px + 1} cy={py + 2} r={pr} fill="rgba(0,0,0,0.3)" />
          {/* Piyon gövdesi */}
          <circle cx={px} cy={py} r={pr} fill={CLR[pawn.color]} stroke={CLR_DARK[pawn.color]} strokeWidth="1.5" />
          {/* Piyon parlaklık efekti */}
          <circle cx={px - pr * 0.35} cy={py - pr * 0.35} r={pr * 0.38} fill="white" opacity="0.45" />
          {isMovable && (
            <circle cx={px} cy={py} r={pr + 1} fill="none" stroke="white" strokeWidth="2" strokeDasharray="3 3" />
          )}
        </g>
      );
    });
  });

  // --- Merkez üçgenleri ---
  const midX = cx(7), midY = cy(7);
  const topLeft  = `${6*C},${6*C}`;
  const topRight = `${9*C},${6*C}`;
  const botLeft  = `${6*C},${9*C}`;
  const botRight = `${9*C},${9*C}`;
  const mid      = `${midX},${midY}`;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
      <svg
        width={B} height={B}
        style={{
          background: 'linear-gradient(135deg, #e8cc9a 0%, #d4a560 50%, #c4953d 100%)',
          borderRadius: '10px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
          border: '5px solid #a07830',
          display: 'block',
        }}
      >
        {/* Ahşap doku çizgileri */}
        {Array.from({ length: 20 }, (_, i) => (
          <line key={`wood${i}`}
            x1="0" y1={i * 24} x2={B} y2={i * 24 + 5}
            stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
        ))}

        {/* Büyük kale daireleri */}
        {[
          { color: 'red',    baseRow: 2.5, baseCol: 2.5 },
          { color: 'green',  baseRow: 2.5, baseCol: 11.5 },
          { color: 'yellow', baseRow: 11.5, baseCol: 11.5 },
          { color: 'blue',   baseRow: 11.5, baseCol: 2.5 },
        ].map(({ color, baseRow, baseCol }) => (
          <g key={`base-${color}`}>
            <circle
              cx={baseCol * C} cy={baseRow * C}
              r={C * 2.55}
              fill={CLR[color]} stroke="#333" strokeWidth="2.5"
            />
            {/* İç beyaz yuva daireleri */}
            {BASE_SLOTS[color].map(([r, c], i) => (
              <circle key={`slot-${color}-${i}`}
                cx={cx(c)} cy={cy(r)}
                r={C * 0.38}
                fill="white" stroke="rgba(0,0,0,0.2)" strokeWidth="1" opacity="0.85"
              />
            ))}
          </g>
        ))}

        {/* Ana yol hücreleri */}
        {trackCells.map(({ row, col, isSafe }) => (
          <g key={`t${row},${col}`}>
            <circle
              cx={cx(col)} cy={cy(row)} r={r}
              fill="white" stroke="#999" strokeWidth="1"
            />
            {isSafe && (
              <text
                x={cx(col)} y={cy(row) + 5}
                textAnchor="middle" fontSize="13" fill="#f59e0b"
                style={{ userSelect: 'none' }}
              >
                ★
              </text>
            )}
          </g>
        ))}

        {/* Ev koridoru hücreleri */}
        {homeCells.map(({ row, col, color }) => (
          <circle key={`h${row},${col}`}
            cx={cx(col)} cy={cy(row)} r={r}
            fill={CLR[color]} stroke={CLR_DARK[color]} strokeWidth="1" opacity="0.85"
          />
        ))}

        {/* Merkez 4 üçgen */}
        <polygon points={`${topLeft} ${botLeft} ${mid}`}  fill={CLR.red}    stroke="white" strokeWidth="1" />
        <polygon points={`${topLeft} ${topRight} ${mid}`} fill={CLR.green}  stroke="white" strokeWidth="1" />
        <polygon points={`${topRight} ${botRight} ${mid}`}fill={CLR.yellow} stroke="white" strokeWidth="1" />
        <polygon points={`${botLeft} ${botRight} ${mid}`} fill={CLR.blue}   stroke="white" strokeWidth="1" />

        {/* Merkez yıldız */}
        <circle cx={midX} cy={midY} r={14} fill="white" opacity="0.8" />
        <text x={midX} y={midY+6} textAnchor="middle" fontSize="16" fill="#333">★</text>

        {/* PARK ALANI yazıları */}
        {[
          { x: C * 3, y: C * 0.7,  txt: 'PARK ALANI' },
          { x: C * 12, y: C * 0.7, txt: 'PARK ALANI' },
          { x: C * 3, y: C * 14.5, txt: 'PARK ALANI' },
          { x: C * 12, y: C * 14.5,txt: 'PARK ALANI' },
        ].map(({ x, y, txt }, i) => (
          <text key={`label${i}`} x={x} y={y}
            textAnchor="middle" fontSize="11" fontWeight="bold"
            fill="#333" style={{ userSelect: 'none', fontFamily: 'Arial, sans-serif' }}
          >
            {txt}
          </text>
        ))}

        {/* Piyonlar */}
        {pawnElements}
      </svg>
    </div>
  );
}
