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
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Veritabanına bağlan
// connectDB(); // Şimdilik yoruma alıyoruz, MongoDB URI eklendiğinde açılacak

// Temel Route
app.get('/', (req, res) => {
  res.send('Kutu Oyunu API Çalışıyor');
});

// Oyun odaları verileri
const rooms = {};

// Socket.io Olayları
io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı:', socket.id);

  socket.on('get_rooms', () => {
    socket.emit('rooms_list', Object.values(rooms));
  });

  socket.on('create_room', ({ roomId, name, gameType, maxPlayers, user }) => {
    rooms[roomId] = {
      id: roomId,
      name,
      gameType,
      status: 'waiting', // Lobi durumu
      players: [{ ...user, color: 'red' }], // İlk oyuncu Kırmızı
      maxPlayers: gameType === 'ludo' ? 4 : maxPlayers,
      creatorId: user.id,
      gameState: gameType === 'ludo' ? { 
        turn: 'red',
        lastDice: 0,
        pawns: {
          red: [-1, -1, -1, -1],
          green: [-1, -1, -1, -1],
          yellow: [-1, -1, -1, -1],
          blue: [-1, -1, -1, -1]
        }
      } : { drawnNumbers: [] }
    };
    socket.join(roomId);
    io.emit('rooms_list', Object.values(rooms));
    console.log(`Kullanıcı ${user.username} odayı kurdu: ${roomId}`);
  });

  socket.on('delete_room', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.creatorId === user.id) {
      delete rooms[roomId];
      io.to(roomId).emit('room_deleted'); // Odadakilere haber ver
      io.emit('rooms_list', Object.values(rooms)); // Lobiye güncel listeyi gönder
      console.log(`Kullanıcı ${user.username} odayı sildi: ${roomId}`);
    }
  });

  socket.on('join_room', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.players.length < room.maxPlayers && room.status === 'waiting') {
      if (!room.players.find(p => p.id === user.id)) {
        const colors = ['red', 'green', 'yellow', 'blue'];
        const usedColors = room.players.map(p => p.color);
        const availableColors = colors.filter(c => !usedColors.includes(c));
        const assignedColor = availableColors.length > 0 ? availableColors[0] : null;
        room.players.push({ ...user, color: assignedColor });
      }
      socket.join(roomId);
      io.to(roomId).emit('room_state_update', room);
      io.emit('rooms_list', Object.values(rooms));
      console.log(`Kullanıcı ${user.username} odaya katıldı: ${roomId}`);
    } else if (!room) {
      socket.join(roomId);
    }
  });

  // Lobi: Renk Seçimi
  socket.on('select_color', ({ roomId, user, color }) => {
    const room = rooms[roomId];
    if (room && room.status === 'waiting') {
      const isTaken = room.players.some(p => p.color === color && p.id !== user.id);
      if (!isTaken) {
        const playerIndex = room.players.findIndex(p => p.id === user.id);
        if (playerIndex !== -1) {
          room.players[playerIndex].color = color;
          io.to(roomId).emit('room_state_update', room);
        }
      }
    }
  });

  // Lobi: Oyunu Başlat
  socket.on('start_game', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.creatorId === user.id && room.status === 'waiting' && room.players.length >= 2) {
      room.status = 'playing';
      if (room.gameType === 'ludo') {
        room.gameState.turn = room.players[0].color; // Oyunu başlatan (veya ilk kişi) sırayı alır
      }
      io.to(roomId).emit('room_state_update', room);
      io.emit('rooms_list', Object.values(rooms)); // Odadakilerin oyun içinde olduğunu lobiye yansıtmak isterseniz
    }
  });

  // Sohbet Mesajları
  socket.on('send_message', ({ roomId, message }) => {
    io.to(roomId).emit('receive_message', message);
  });

  // Kızma Birader - Zar Atma
  socket.on('roll_dice', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.gameType === 'ludo') {
      const player = room.players.find(p => p.id === user.id);
      if (player && room.gameState.turn === player.color && room.gameState.lastDice === 0) {
        const dice = Math.floor(Math.random() * 6) + 1;
        room.gameState.lastDice = dice;
        io.to(roomId).emit('dice_rolled', { user, dice });
        io.to(roomId).emit('receive_message', { user: 'Sistem', text: `${user.username} zarı attı: ${dice}` });
        
        // Hamle yapılamayacak durumdaysa (ör: kalede ve 6 değil, başka piyon yok)
        // Basitlik adına oyuncu "Pas Geç" tuşunu kullanabilir.
        io.to(roomId).emit('room_state_update', room);
      }
    }
  });

  const SAFE_ZONES = [0, 8, 13, 21, 26, 34, 39, 47]; // Yıldızlı ve başlangıç alanları (Mutlak koordinatlar 0-51)
  const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };

  socket.on('move_pawn', ({ roomId, user, pawnIndex }) => {
    const room = rooms[roomId];
    if (room && room.gameType === 'ludo') {
      const player = room.players.find(p => p.id === user.id);
      const dice = room.gameState.lastDice;

      if (player && room.gameState.turn === player.color && dice > 0) {
        let pos = room.gameState.pawns[player.color][pawnIndex];
        let newPos = pos;
        let moveValid = false;

        // Hamleyi kurallara göre hesapla
        if (pos === -1) {
          if (dice === 6) {
            newPos = 0; // Yolun başlangıcına çık
            moveValid = true;
          }
        } else if (pos >= 0 && pos <= 50) {
          newPos = pos + dice;
          if (newPos > 50) {
            // Home bölgesine giriş
            const overshoot = newPos - 51;
            newPos = 100 + overshoot;
          }
          moveValid = true;
        } else if (pos >= 100) {
          newPos = pos + dice;
          if (newPos <= 105) {
            moveValid = true; // Tam isabetle veya ilerleyerek
          }
        }

        if (moveValid) {
          // Mutlak pozisyonu hesapla (sadece normal yol için)
          let newAbsolutePos = -1;
          if (newPos >= 0 && newPos <= 51) {
            newAbsolutePos = (START_INDEX[player.color] + newPos) % 52;
          }

          // Piyon kırma kontrolü (Güvenli bölge değilse ve normal yoldaysa)
          if (newAbsolutePos !== -1 && !SAFE_ZONES.includes(newAbsolutePos)) {
            Object.keys(room.gameState.pawns).forEach(color => {
              if (color !== player.color) {
                room.gameState.pawns[color].forEach((otherPos, otherIdx) => {
                  if (otherPos >= 0 && otherPos <= 51) {
                    let otherAbsolutePos = (START_INDEX[color] + otherPos) % 52;
                    if (otherAbsolutePos === newAbsolutePos) {
                      // Kırıldı!
                      room.gameState.pawns[color][otherIdx] = -1;
                      io.to(roomId).emit('receive_message', { user: 'Sistem', text: `${player.username}, ${color} piyonunu kırdı!` });
                    }
                  }
                });
              }
            });
          }

          // Pozisyonu güncelle
          room.gameState.pawns[player.color][pawnIndex] = newPos;
          room.gameState.lastDice = 0;

          // 6 atan veya kırma yapan tekrar atar kuralı (şimdi sadece 6 atana hak verelim)
          if (dice !== 6) {
            const currentIndex = room.players.findIndex(p => p.color === player.color);
            let nextIndex = (currentIndex + 1) % room.players.length;
            room.gameState.turn = room.players[nextIndex].color;
          }

          // Oyun bitti mi kontrolü
          const hasWon = room.gameState.pawns[player.color].every(p => p === 105);
          if (hasWon) {
             io.to(roomId).emit('receive_message', { user: 'Sistem', text: `🎉 ${player.username} OYUNU KAZANDI! 🎉` });
             room.status = 'waiting'; // Oyunu lobiye döndür
          }

          io.to(roomId).emit('room_state_update', room);
        }
      }
    }
  });

  socket.on('pass_turn', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.gameType === 'ludo') {
      const player = room.players.find(p => p.id === user.id);
      if (player && room.gameState.turn === player.color) {
        const currentIndex = room.players.findIndex(p => p.color === player.color);
        let nextIndex = (currentIndex + 1) % room.players.length;
        room.gameState.turn = room.players[nextIndex].color;
        room.gameState.lastDice = 0;
        io.to(roomId).emit('room_state_update', room);
      }
    }
  });

  // Tombala - Taş Çekme
  socket.on('draw_number', ({ roomId, user }) => {
    const number = Math.floor(Math.random() * 90) + 1;
    const room = rooms[roomId];
    if (room && room.gameType === 'bingo') {
      room.gameState.drawnNumbers.push(number);
      io.to(roomId).emit('number_drawn', { user, number, allNumbers: room.gameState.drawnNumbers });
      io.to(roomId).emit('receive_message', { user: 'Sistem', text: `Çekilen numara: ${number}` });
    }
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
    // TODO: Kullanıcıyı odalardan temizle
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
