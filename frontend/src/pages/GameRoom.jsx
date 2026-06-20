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

  const handlePawnMove = (color, pawnIndex) => {
    if (!room || room.gameType !== 'ludo') return;
    
    const player = room.players.find(p => p.id === user.id);
    if (!player || player.color !== color) {
      // Sadece kendi piyonuna tıklayabilir
      return;
    }

    if (room.gameState.turn !== color || room.gameState.lastDice === 0) {
      // Sıra onda değil veya zar atmamış
      return;
    }

    const pos = room.gameState.pawns[color][pawnIndex];
    const dice = room.gameState.lastDice;
    let newPos = pos;

    if (pos === -1) {
      if (dice === 6) newPos = 0;
      else return; // 6 atmadan çıkamaz
    } else if (pos >= 0 && pos <= 50) {
      newPos = pos + dice;
      if (newPos > 50) {
        const overshoot = newPos - 51;
        newPos = 100 + overshoot;
      }
    } else if (pos >= 100) {
      newPos = pos + dice;
      if (newPos > 105) return; // Bitişi geçemez
    } else {
      return; // Zaten bitmiş
    }

    socket.emit('move_pawn', { roomId, user, pawnIndex, newPos });
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
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', overflow: 'auto', flexDirection: 'column' }}>
          {room && (
            <div style={{ padding: '10px', color: 'var(--text-secondary)' }}>
              Odaktaki Oyuncular: {room.players.map(p => p.username).join(', ')}
            </div>
          )}
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {gameType === 'ludo' && room && room.gameState && (
              <div style={{ marginBottom: '20px', textAlign: 'center', width: '100%' }}>
                <h3 style={{ margin: '0 0 10px 0', color: room.gameState.turn === 'red' ? '#ef4444' : room.gameState.turn === 'green' ? '#10b981' : room.gameState.turn === 'yellow' ? '#eab308' : '#3b82f6' }}>
                  Sıra: {room.gameState.turn === 'red' ? 'Kırmızı' : room.gameState.turn === 'green' ? 'Yeşil' : room.gameState.turn === 'yellow' ? 'Sarı' : 'Mavi'}
                </h3>
                {room.gameState.lastDice > 0 && (
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                    Atılan Zar: <strong>{room.gameState.lastDice}</strong>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                  <button onClick={handleRollDice} disabled={room.gameState.turn !== playerColor || room.gameState.lastDice > 0}>
                    Zar At
                  </button>
                  <button 
                    onClick={() => { if (socket) socket.emit('pass_turn', { roomId, user }) }} 
                    disabled={room.gameState.turn !== playerColor || room.gameState.lastDice === 0} 
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    Pas Geç
                  </button>
                </div>
              </div>
            )}
            
            {gameType === 'ludo' ? (
              <LudoBoard roomState={room?.gameState} onMove={handlePawnMove} />
            ) : (
              <>
                <BingoBoard roomState={room?.gameState} />
                <button onClick={handleDrawNumber} style={{ marginTop: '20px', padding: '6px 12px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  Taş Çek
                </button>
              </>
            )}
          </div>
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
