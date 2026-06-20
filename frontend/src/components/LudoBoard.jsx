export default function LudoBoard() {
  // Basit bir Kızma Birader görsel tasarımı
  // CSS Grid kullanarak oluşturuldu
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '400px',
        height: '400px',
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid var(--glass-border)',
        borderRadius: '16px',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        overflow: 'hidden',
        boxShadow: 'var(--glass-shadow)'
      }}>
        {/* Kırmızı Bölge */}
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '60%', height: '60%', background: 'rgba(239, 68, 68, 0.5)', borderRadius: '12px' }}></div>
        </div>
        {/* Üst Yol */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', borderBottom: '1px solid var(--glass-border)' }}>
          {Array.from({length: 18}).map((_, i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.05)' }}></div>
          ))}
        </div>
        {/* Yeşil Bölge */}
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', borderLeft: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '60%', height: '60%', background: 'rgba(16, 185, 129, 0.5)', borderRadius: '12px' }}></div>
        </div>
        
        {/* Sol Yol */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', borderRight: '1px solid var(--glass-border)' }}>
          {Array.from({length: 18}).map((_, i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.05)' }}></div>
          ))}
        </div>
        {/* Merkez */}
        <div style={{ 
          background: 'linear-gradient(45deg, rgba(239,68,68,0.3) 25%, rgba(59,130,246,0.3) 25% 50%, rgba(234,179,8,0.3) 50% 75%, rgba(16,185,129,0.3) 75%)',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <span style={{ fontSize: '24px' }}>★</span>
        </div>
        {/* Sağ Yol */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', borderLeft: '1px solid var(--glass-border)' }}>
          {Array.from({length: 18}).map((_, i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.05)' }}></div>
          ))}
        </div>

        {/* Mavi Bölge */}
        <div style={{ background: 'rgba(59, 130, 246, 0.2)', borderRight: '1px solid var(--glass-border)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '60%', height: '60%', background: 'rgba(59, 130, 246, 0.5)', borderRadius: '12px' }}></div>
        </div>
        {/* Alt Yol */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', borderTop: '1px solid var(--glass-border)' }}>
          {Array.from({length: 18}).map((_, i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.05)' }}></div>
          ))}
        </div>
        {/* Sarı Bölge */}
        <div style={{ background: 'rgba(234, 179, 8, 0.2)', borderLeft: '1px solid var(--glass-border)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '60%', height: '60%', background: 'rgba(234, 179, 8, 0.5)', borderRadius: '12px' }}></div>
        </div>
      </div>
    </div>
  );
}
