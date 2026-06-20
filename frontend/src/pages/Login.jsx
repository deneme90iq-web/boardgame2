import { useState } from 'react';
import { User, Gamepad2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      // Rastgele bir ID oluştur ve doğrudan giriş yap
      const randomId = Math.random().toString(36).substring(2, 10);
      onLogin({ id: randomId, username: username.trim() });
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 150px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Gamepad2 size={48} color="var(--accent-primary)" style={{ marginBottom: '15px' }} />
          <h2>Test Hesabı Aç</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Oyuna katılmak için bir isim girin
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <User size={20} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Oyuncu İsminiz" 
              style={{ paddingLeft: '48px' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={15}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
            Oyuna Gir
          </button>
        </form>
      </div>
    </div>
  );
}
