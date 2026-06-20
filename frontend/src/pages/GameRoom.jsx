import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import LudoBoard from '../components/LudoBoard';
import BingoBoard from '../components/BingoBoard';
import Dice from '../components/Dice';


const COLOR_HEX   = { red: '#ef4444', green: '#3b82f6', yellow: '#22c55e', blue: '#eab308' };
const COLOR_LOBBY = { red: '#ef4444', green: '#3b82f6', yellow: '#22c55e', blue: '#eab308' };
const COLOR_NAME  = { red: 'Kırmızı', green: 'Mavi', yellow: 'Yeşil', blue: 'Sarı' };


export default function GameRoom({ user }) {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const [room, setRoom]         = useState(null);
  const [rolling, setRolling]   = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const socket = io(url);
    socketRef.current = socket;

    socket.emit('join_room', { roomId, user });

    socket.on('room_state_update', setRoom);
    socket.on('room_deleted', () => { alert('Oda silindi.'); navigate('/lobby'); });

    return () => socket.close();
  }, [roomId, user, navigate]);


  const emit = (event, data) => socketRef.current?.emit(event, data);

  const handleRoll = () => {
    if (!canRoll || rolling) return;
    setRolling(true);
    emit('roll_dice', { roomId, user });
    // Animasyon süresi kadar bekle
    setTimeout(() => setRolling(false), 800);
  };

  const playerColor  = room?.players.find(p => p.id === user.id)?.color ?? null;
  const gameType     = room?.gameType ?? 'ludo';
  const gs           = room?.gameState;
  const isMyTurn     = gs?.turn === playerColor;
  const canRoll      = isMyTurn && gs?.lastDice === 0 && !gs?.winner;
  const winner       = gs?.winner;

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Başlık */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/lobby')} style={{ background: 'none', boxShadow: 'none', padding: '6px' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0, flex: 1 }}>Oda: {room?.name ?? roomId}</h2>
          {room && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kod: <strong>{roomId}</strong></span>}
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>

          {/* KAZANAN EKRANI */}
          {winner && (
            <div style={{
              background: 'rgba(0,0,0,0.7)', borderRadius: '15px', padding: '30px 40px',
              textAlign: 'center', marginBottom: '20px', border: `2px solid ${COLOR_HEX[winner]}`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
              <h2 style={{ color: COLOR_HEX[winner] }}>
                {room.players.find(p => p.color === winner)?.username} KAZANDI!
              </h2>
            </div>
          )}

          {/* LOBİ */}
          {room?.status === 'waiting' && (
            <div style={{
              background: 'rgba(0,0,0,0.4)', padding: '30px', borderRadius: '15px',
              width: '100%', maxWidth: '500px', textAlign: 'center'
            }}>
              <h2 style={{ margin: '0 0 8px' }}>Bekleme Salonu</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>
                Oyuncular katılsın ve renk seçsin
              </p>

              {/* Renk Paleti */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '28px' }}>
                {['red','green','yellow','blue'].map(c => {
                  const taken    = room.players.find(p => p.color === c);
                  const isMe     = taken?.id === user.id;
                  const disabled = !!taken && !isMe;
                  const label    = COLOR_NAME[c];
                  return (
                    <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => !disabled && emit('select_color', { roomId, user, color: c })}
                        style={{
                          width: '64px', height: '64px', borderRadius: '50%',
                          backgroundColor: COLOR_LOBBY[c],
                          border: isMe ? '4px solid white' : disabled ? '2px solid #444' : '2px solid transparent',
                          opacity: disabled ? 0.35 : 1,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          boxShadow: isMe ? `0 0 18px ${COLOR_LOBBY[c]}` : 'none',
                          transform: isMe ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.2s',
                          padding: 0,
                        }}
                        title={disabled ? `${taken.username} seçti` : `${label} seç`}
                      />
                      <span style={{
                        fontSize: '12px',
                        fontWeight: isMe ? 'bold' : 'normal',
                        color: isMe ? COLOR_LOBBY[c] : 'var(--text-secondary)'
                      }}>
                        {taken ? `${taken.username}${isMe ? ' ✓' : ''}` : label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Başlat / Bekle */}
              {room.creatorId === user.id ? (
                <button
                  onClick={() => emit('start_game', { roomId, user })}
                  disabled={room.players.length < 2}
                  style={{
                    padding: '12px 28px', fontSize: '16px', fontWeight: 'bold',
                    background: room.players.length >= 2 ? 'var(--accent-primary)' : '#555',
                  }}
                >
                  🎮 Oyunu Başlat
                </button>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>
                  Kurucu oyunu başlatmayı bekliyor…
                </p>
              )}
              {room.players.length < 2 && (
                <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>
                  En az 2 kişi gerekli
                </p>
              )}
            </div>
          )}

          {/* OYUN */}
          {room?.status === 'playing' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Sıra ve Zar Bilgisi */}
              {gs && !winner && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 8px', color: COLOR_HEX[gs.turn] }}>
                    Sıra: {room.players.find(p => p.color === gs.turn)?.username}
                    {gs.turn === playerColor ? ' (Sen)' : ''}
                  </h3>
                  {gs.lastDice > 0 && (
                    <div style={{ fontSize: '20px', marginBottom: '10px' }}>
                      Zar: <strong>{gs.lastDice}</strong>
                    </div>
                  )}
              {/* Sadece aktif oyuncuya göster */}
              {isMyTurn && !winner && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Dice
                    value={gs.lastDice || null}
                    rolling={rolling}
                    disabled={!canRoll}
                    onRoll={handleRoll}
                  />
                  {gs.lastDice > 0 && gs.movablePawns?.length === 0 && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      ⏳ Sıra geçiyor…
                    </span>
                  )}
                </div>
              )}
              {/* Sırası olmayan oyunculara sadece zarı göster */}
              {!isMyTurn && gs.lastDice > 0 && (
                <div style={{ opacity: 0.7 }}>
                  <Dice value={gs.lastDice} rolling={false} disabled={true} onRoll={() => {}} />
                </div>
              )}
                </div>
              )}

              {/* TAHTA */}
              {gameType === 'ludo' ? (
                <LudoBoard
                  roomState={gs}
                  playerColor={playerColor}
                  onMove={(color, idx) => emit('move_pawn', { roomId, user, pawnIndex: idx })}
                />
              ) : (
                <>
                  <BingoBoard roomState={gs} />
                  <button
                    onClick={() => emit('draw_number', { roomId, user })}
                    style={{ marginTop: '20px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    Taş Çek
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
