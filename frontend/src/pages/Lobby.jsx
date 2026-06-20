import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Dices } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Lobby({ user }) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    newSocket.emit('get_rooms');

    newSocket.on('rooms_list', (roomsList) => {
      setRooms(roomsList);
    });

    return () => newSocket.close();
  }, []);

  const handleCreateRoom = (gameType) => {
    if (!socket) return;
    const newRoomId = Math.random().toString(36).substring(7);
    socket.emit('create_room', {
      roomId: newRoomId,
      name: `${user.username}'in Odası`,
      gameType,
      maxPlayers: gameType === 'ludo' ? 4 : 10,
      user
    });
    navigate(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="glass-panel" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h2>Oyun Lobisi</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <input 
              type="text" 
              placeholder="Oda Kodu" 
              id="roomCodeInput"
              style={{ background: 'transparent', border: 'none', padding: '8px 15px', color: 'white', width: '120px' }}
            />
            <button 
              onClick={() => {
                const code = document.getElementById('roomCodeInput').value.trim();
                if (code) handleJoinRoom(code);
              }}
              style={{ borderRadius: 0, padding: '8px 15px', background: 'var(--accent-secondary)' }}
            >
              Katıl
            </button>
          </div>
          
          <span style={{ color: 'var(--text-secondary)', margin: '0 10px' }}>veya</span>

          <button onClick={() => handleCreateRoom('ludo')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Kızma Birader Kur
          </button>
          <button onClick={() => handleCreateRoom('bingo')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Plus size={18} /> Tombala Kur
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {rooms.map((room) => (
          <div key={room.id} style={{ 
            background: 'rgba(15, 23, 42, 0.4)', 
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '20px',
            transition: 'transform 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {room.creatorId === user.id && (
              <button 
                onClick={() => socket.emit('delete_room', { roomId: room.id, user })}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'var(--danger)',
                  padding: '4px 8px',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  zIndex: 10
                }}
                title="Odayı Sil"
              >
                ✕
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>{room.name}</h3>
              <span style={{ 
                background: room.gameType === 'ludo' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                color: room.gameType === 'ludo' ? 'var(--accent-primary)' : '#10b981',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {room.gameType === 'ludo' ? 'Kızma Birader' : 'Tombala'}
              </span>
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Oda Kodu: <strong style={{ color: 'white', letterSpacing: '1px' }}>{room.id}</strong>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
              <Users size={16} style={{ marginRight: '6px' }} />
              {room.players ? room.players.length : 0} / {room.maxPlayers} Oyuncu
            </div>
            
            <button 
              onClick={() => handleJoinRoom(room.id)}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <Dices size={18} /> Katıl
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
