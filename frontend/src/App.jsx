import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid,
          username: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
    }
  };

  if (loading) {
    return <div className="flex-center min-h-screen">Yükleniyor...</div>;
  }

  return (
    <Router>
      <div className="app-container min-h-screen">
        <header className="app-header container">
          <div className="logo">Kutu Oyunu Platformu</div>
          {user && (
            <div className="user-info">
              <span>Hoş geldin, {user.username}</span>
              <button onClick={handleLogout} style={{ marginLeft: '15px', padding: '6px 12px', fontSize: '14px' }}>
                Çıkış Yap
              </button>
            </div>
          )}
        </header>

        <main className="container">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Navigate to="/lobby" /> : <Login onLogin={setUser} />} 
            />
            <Route 
              path="/lobby" 
              element={user ? <Lobby user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/room/:roomId" 
              element={user ? <GameRoom user={user} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
