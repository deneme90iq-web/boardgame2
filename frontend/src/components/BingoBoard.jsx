export default function BingoBoard({ roomState }) {
  // Basit bir Tombala (Bingo) kartı prototipi
  const cardData = [
    [5, null, 23, null, 42, null, 67, null, 89],
    [null, 12, null, 35, null, 56, null, 74, 90],
    [3, null, 28, null, 49, null, 61, 78, null]
  ];

  const drawnNumbers = roomState?.drawnNumbers || [];

  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--accent-primary)' }}>
        Tombala Kartı
      </h3>
      <div style={{ display: 'grid', gap: '8px' }}>
        {cardData.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '8px' }}>
            {row.map((cell, colIndex) => {
              const isDrawn = cell && drawnNumbers.includes(cell);
              return (
                <div 
                  key={colIndex}
                  style={{
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDrawn ? 'var(--accent-primary)' : (cell ? 'var(--glass-bg)' : 'transparent'),
                    border: cell ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: isDrawn ? '#fff' : (cell ? 'var(--text-primary)' : 'transparent'),
                    boxShadow: cell ? '0 4px 6px rgba(0,0,0,0.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {cell || '-'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        <div style={{ width: '100%', marginBottom: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>Çıkan Numaralar:</div>
        {drawnNumbers.map((num, idx) => (
          <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
            {num}
          </span>
        ))}
      </div>
    </div>
  );
}
