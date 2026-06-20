import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import LudoBoard from '../components/LudoBoard';
import BingoBoard from '../components/BingoBoard';

export default function GameRoom({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    newSocket.emit('join_room', { roomId, user });

    newSocket.on('room_state_update', (roomData) => {
      setRoom(roomData);
    });

    newSocket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('dice_rolled', ({ user: roller, dice }) => {
      // Zar atıldığında yapılacak animasyon vs eklenebilir
      console.log(`${roller.username} zarı attı: ${dice}`);
    });

    newSocket.on('number_drawn', ({ user: drawer, number, allNumbers }) => {
      setRoom(prev => ({
        ...prev,
        gameState: { ...prev.gameState, drawnNumbers: allNumbers }
      }));
    });

    newSocket.on('room_deleted', () => {
      alert('Bu oda kurucu tarafından silindi.');
      navigate('/lobby');
    });

    return () => newSocket.close();
  }, [roomId, user, navigate]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('send_message', { roomId, message: { user: user.username, text: newMessage } });
      setNewMessage('');
    }
  };

  const handleRollDice = () => {
    if (socket) socket.emit('roll_dice', { roomId, user });
  };

  const handleDrawNumber = () => {
    if (socket) socket.emit('draw_number', { roomId, user });
  };

  const gameType = room ? room.gameType : 'ludo';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Oyun Alanı */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => navigate('/lobby')} 
              style={{ background: 'none', boxShadow: 'none', padding: '8px', marginRight: '15px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 style={{ margin: 0 }}>Oda: {room ? room.name : roomId}</h2>
          </div>
          <div>
            {gameType === 'ludo' ? (
              <button onClick={handleRollDice} style={{ padding: '6px 12px', fontSize: '12px' }}>
                Zar At
              </button>
            ) : (
              <button onClick={handleDrawNumber} style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                Taş Çek
              </button>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', overflow: 'auto', flexDirection: 'column' }}>
          {room && (
            <div style={{ padding: '10px', color: 'var(--text-secondary)' }}>
              Odaktaki Oyuncular: {room.players.map(p => p.username).join(', ')}
            </div>
          )}
          {gameType === 'ludo' ? <LudoBoard /> : <BingoBoard roomState={room?.gameState} />}
        </div>
      </div>

      {/* Sohbet Alanı */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={18} />
          <h3 style={{ fontSize: '16px', margin: 0 }}>Sohbet</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              background: msg.user === user.username ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
              padding: '10px',
              borderRadius: '8px',
              alignSelf: msg.user === user.username ? 'flex-end' : 'flex-start',
              maxWidth: '90%'
            }}>
              <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '4px', fontWeight: 'bold' }}>
                {msg.user}
              </div>
              <div style={{ fontSize: '14px' }}>{msg.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Mesaj yaz..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ padding: '10px' }}
          />
          <button type="submit" style={{ padding: '10px' }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
