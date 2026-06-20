import { useState } from 'react';
import { User, Lock, Gamepad2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(cred.user, { displayName: formData.username });
        await setDoc(doc(db, 'users', cred.user.uid), {
          username: formData.username,
          email: formData.email,
          createdAt: new Date(),
        });
        onLogin({ id: cred.user.uid, username: formData.username });
      } else {
        const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onLogin({ id: cred.user.uid, username: cred.user.displayName || formData.email.split('@')[0] });
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Bu e-posta zaten kullanımda.');
      else if (err.code === 'auth/invalid-credential') setError('Hatalı e-posta veya şifre.');
      else if (err.code === 'auth/weak-password') setError('Şifre en az 6 karakter olmalı.');
      else setError('Hata: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const change = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 150px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Gamepad2 size={48} color="var(--accent-primary)" style={{ marginBottom: '14px' }} />
          <h2>{isRegistering ? 'Hesap Oluştur' : 'Giriş Yap'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {isRegistering ? 'Eğlenceye katılmak için kaydol' : 'Oyuna devam et'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(239,68,68,0.15)',
            color: '#f87171', borderRadius: '8px', marginBottom: '20px',
            fontSize: '14px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div style={{ marginBottom: '18px', position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-secondary)' }} />
              <input type="text" placeholder="Kullanıcı Adı" style={{ paddingLeft: '44px' }}
                value={formData.username} onChange={change('username')} required />
            </div>
          )}

          <div style={{ marginBottom: '18px', position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-secondary)' }} />
            <input type="email" placeholder="E-posta Adresi" style={{ paddingLeft: '44px' }}
              value={formData.email} onChange={change('email')} required />
          </div>

          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-secondary)' }} />
            <input type="password" placeholder="Şifre" style={{ paddingLeft: '44px' }}
              value={formData.password} onChange={change('password')} required />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Bekleniyor…' : isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <button
            type="button"
            style={{ background: 'none', boxShadow: 'none', color: 'var(--text-secondary)', fontSize: '14px' }}
            onClick={() => { setIsRegistering(r => !r); setError(''); }}
          >
            {isRegistering ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
          </button>
        </div>
      </div>
    </div>
  );
}
