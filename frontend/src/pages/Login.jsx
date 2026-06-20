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
        // Kayıt Ol
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Kullanıcı adını profiline ekle
        await updateProfile(userCredential.user, {
          displayName: formData.username
        });

        // Firestore'a kullanıcı profilini kaydet
        await setDoc(doc(db, "users", userCredential.user.uid), {
          username: formData.username,
          email: formData.email,
          createdAt: new Date()
        });

        onLogin({ id: userCredential.user.uid, username: formData.username });
      } else {
        // Giriş Yap
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onLogin({ id: userCredential.user.uid, username: userCredential.user.displayName || formData.email.split('@')[0] });
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Bu e-posta adresi zaten kullanımda.');
      else if (err.code === 'auth/invalid-credential') setError('Hatalı e-posta veya şifre.');
      else setError('Bir hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 150px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Gamepad2 size={48} color="var(--accent-primary)" style={{ marginBottom: '15px' }} />
          <h2>{isRegistering ? 'Hesap Oluştur' : 'Giriş Yap'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            {isRegistering ? 'Eğlenceye katılmak için kaydol' : 'Oyun oynamaya devam et'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <User size={20} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Kullanıcı Adı" 
                style={{ paddingLeft: '48px' }}
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required={isRegistering}
              />
            </div>
          )}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <User size={20} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              placeholder="E-posta Adresi" 
              style={{ paddingLeft: '48px' }}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Şifre" 
              style={{ paddingLeft: '48px' }}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '16px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Bekleniyor...' : (isRegistering ? 'Kayıt Ol' : 'Giriş Yap')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            type="button" 
            style={{ background: 'none', boxShadow: 'none', color: 'var(--text-secondary)' }}
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          >
            {isRegistering ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
          </button>
        </div>
      </div>
    </div>
  );
}
