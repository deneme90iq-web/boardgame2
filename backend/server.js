const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.get('/', (req, res) => res.send('Kutu Oyunu API Çalışıyor'));

const rooms = {};

// ============================================================
// KIZMA BİRADER (LUDO) OYUN MANTIĞI
// ============================================================

// Her rengin ana yolda hangi mutlak hücreden başladığı
const COLOR_START_ABS = { red: 0, green: 13, yellow: 26, blue: 39 };

// Güvenli hücreler (mutlak pozisyon 0-51): başlangıç ve yıldız kareleri
const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Mutlak pozisyon hesapla
function absPos(color, relPos) {
  return (COLOR_START_ABS[color] + relPos) % 52;
}

// Piyon hareket edebilir mi?
function canMove(pos, dice) {
  if (pos === 105) return false;           // Bitişte, artık hareket etmez
  if (pos === -1) return dice === 6;       // Kalede, sadece 6 ile çıkar
  if (pos >= 0 && pos <= 51) {             // Ana yolda
    const dest = pos + dice;
    return dest <= 57;                     // 52=ev[0]...57=merkez(105)
  }
  if (pos >= 100 && pos <= 104) {          // Ev koridorunda
    return pos + dice <= 105;
  }
  return false;
}

// Yeni pozisyonu hesapla
function applyMove(pos, dice) {
  if (pos === -1) return 0;
  if (pos >= 0 && pos <= 51) {
    const dest = pos + dice;
    if (dest <= 51) return dest;
    return 100 + (dest - 52);             // Ev koridoruna giriş
  }
  return pos + dice;                      // Ev koridorunda ilerleme
}

// Piyon yeme kontrolü: yiyen renk + yeni göreceli pozisyon
function checkAndEat(room, eaterColor, newRelPos) {
  if (newRelPos < 0 || newRelPos > 51) return false; // Sadece ana yolda yeme
  const newAbs = absPos(eaterColor, newRelPos);
  if (SAFE_ABS.has(newAbs)) return false; // Güvenli bölge
  let ate = false;
  Object.keys(room.gameState.pawns).forEach(color => {
    if (color === eaterColor) return;
    room.gameState.pawns[color].forEach((pos, idx) => {
      if (pos >= 0 && pos <= 51) {
        if (absPos(color, pos) === newAbs) {
          room.gameState.pawns[color][idx] = -1; // Kaleye gönder
          ate = true;
        }
      }
    });
  });
  return ate;
}

// Sonraki oyuncuya geç
function nextPlayerColor(players, currentColor) {
  const idx = players.findIndex(p => p.color === currentColor);
  return players[(idx + 1) % players.length].color;
}

// Oyuncu kazandı mı?
function hasWon(pawns, color) {
  return pawns[color].every(p => p === 105);
}

// Oyuncunun hareket ettirebileceği piyon indislerini döndür
function getMovable(pawns, color, dice) {
  return pawns[color]
    .map((pos, idx) => ({ idx, pos }))
    .filter(({ pos }) => canMove(pos, dice))
    .map(({ idx }) => idx);
}

// Ludo başlangıç durumu
function initLudoState(players) {
  const pawns = {};
  players.forEach(p => { pawns[p.color] = [-1, -1, -1, -1]; });
  return {
    turn: players[0].color,
    lastDice: 0,
    pawns,
    movablePawns: [],
    winner: null,
  };
}

// ============================================================
// SOCKET.IO OLAYLARI
// ============================================================

io.on('connection', (socket) => {
  console.log('Bağlandı:', socket.id);

  socket.on('get_rooms', () => {
    socket.emit('rooms_list', Object.values(rooms));
  });

  socket.on('create_room', ({ roomId, name, gameType, maxPlayers, user }) => {
    rooms[roomId] = {
      id: roomId, name, gameType,
      status: 'waiting',
      players: [{ ...user, color: 'red' }],
      maxPlayers: gameType === 'ludo' ? 4 : maxPlayers,
      creatorId: user.id,
      gameState: gameType === 'ludo'
        ? initLudoState([{ ...user, color: 'red' }])
        : { drawnNumbers: [] },
    };
    socket.join(roomId);
    io.emit('rooms_list', Object.values(rooms));
    console.log(`${user.username} odayı kurdu: ${roomId}`);
  });

  socket.on('delete_room', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.creatorId === user.id) {
      delete rooms[roomId];
      io.to(roomId).emit('room_deleted');
      io.emit('rooms_list', Object.values(rooms));
      console.log(`${user.username} odayı sildi: ${roomId}`);
    }
  });

  socket.on('join_room', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.players.length < room.maxPlayers && room.status === 'waiting') {
      if (!room.players.find(p => p.id === user.id)) {
        const used = room.players.map(p => p.color);
        const free = ['red','green','yellow','blue'].find(c => !used.includes(c));
        room.players.push({ ...user, color: free || 'red' });
      }
      socket.join(roomId);
      io.to(roomId).emit('room_state_update', room);
      io.emit('rooms_list', Object.values(rooms));
    } else if (room && room.status === 'playing') {
      // Oyun başlamışsa izleyici olarak katıl
      socket.join(roomId);
      socket.emit('room_state_update', room);
    } else if (!room) {
      socket.join(roomId);
    }
  });

  // --- LOBİ ---
  socket.on('select_color', ({ roomId, user, color }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'waiting') return;
    const taken = room.players.some(p => p.color === color && p.id !== user.id);
    if (taken) return;
    const idx = room.players.findIndex(p => p.id === user.id);
    if (idx !== -1) {
      room.players[idx].color = color;
      io.to(roomId).emit('room_state_update', room);
    }
  });

  socket.on('start_game', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (!room || room.creatorId !== user.id || room.status !== 'waiting') return;
    if (room.players.length < 2) return;
    room.status = 'playing';
    room.gameState = initLudoState(room.players);
    io.to(roomId).emit('room_state_update', room);
    io.emit('rooms_list', Object.values(rooms));
  });

  // --- SOHBET ---
  socket.on('send_message', ({ roomId, message }) => {
    io.to(roomId).emit('receive_message', message);
  });

  // --- KIZMA BİRADER ---

  socket.on('roll_dice', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'ludo' || room.status !== 'playing') return;
    const gs = room.gameState;
    if (gs.winner) return;
    const player = room.players.find(p => p.id === user.id);
    if (!player || gs.turn !== player.color || gs.lastDice !== 0) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    gs.lastDice = dice;

    const movable = getMovable(gs.pawns, player.color, dice);
    gs.movablePawns = movable;

    io.to(roomId).emit('receive_message', {
      user: 'Sistem',
      text: `${user.username} ${dice} attı`
    });

    if (movable.length === 0) {
      // Hareket edilecek piyon yok → sırayı otomatik geç
      io.to(roomId).emit('receive_message', {
        user: 'Sistem',
        text: `${user.username} oynayacak piyon bulamadı`
      });
      setTimeout(() => {
        gs.lastDice = 0;
        gs.movablePawns = [];
        gs.turn = nextPlayerColor(room.players, player.color);
        io.to(roomId).emit('room_state_update', room);
      }, 1200);
    }

    io.to(roomId).emit('room_state_update', room);
  });

  socket.on('move_pawn', ({ roomId, user, pawnIndex }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'ludo' || room.status !== 'playing') return;
    const gs = room.gameState;
    if (gs.winner) return;
    const player = room.players.find(p => p.id === user.id);
    if (!player || gs.turn !== player.color || gs.lastDice === 0) return;
    if (!gs.movablePawns.includes(pawnIndex)) return;

    const dice = gs.lastDice;
    const oldPos = gs.pawns[player.color][pawnIndex];
    const newPos = applyMove(oldPos, dice);

    gs.pawns[player.color][pawnIndex] = newPos;
    gs.lastDice = 0;
    gs.movablePawns = [];

    // Yeme kontrolü (sadece ana yolda)
    const ate = checkAndEat(room, player.color, newPos);
    if (ate) {
      io.to(roomId).emit('receive_message', {
        user: 'Sistem',
        text: `${user.username} piyon kırdı! Tekrar oynuyor!`
      });
    }

    // Kazanma kontrolü
    if (hasWon(gs.pawns, player.color)) {
      gs.winner = player.color;
      gs.turn = null;
      io.to(roomId).emit('receive_message', {
        user: 'Sistem',
        text: `🎉 ${user.username} OYUNU KAZANDI! 🎉`
      });
      io.to(roomId).emit('room_state_update', room);
      return;
    }

    // Ekstra tur: 6 atma veya piyon yeme
    if (dice === 6 || ate) {
      // Aynı oyuncu tekrar atar
      io.to(roomId).emit('receive_message', {
        user: 'Sistem',
        text: `${user.username} ${ate ? 'piyon kırdığı' : '6 attığı'} için tekrar oynuyor!`
      });
    } else {
      gs.turn = nextPlayerColor(room.players, player.color);
    }

    io.to(roomId).emit('room_state_update', room);
  });

  // --- TOMBALA ---
  socket.on('draw_number', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'bingo') return;
    const number = Math.floor(Math.random() * 90) + 1;
    room.gameState.drawnNumbers.push(number);
    io.to(roomId).emit('number_drawn', { user, number, allNumbers: room.gameState.drawnNumbers });
    io.to(roomId).emit('receive_message', { user: 'Sistem', text: `Çekilen numara: ${number}` });
  });

  socket.on('disconnect', () => {
    console.log('Ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));
