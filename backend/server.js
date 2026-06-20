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
    if (room && room.players.length < room.maxPlayers) {
      if (!room.players.find(p => p.id === user.id)) {
        const colors = ['red', 'green', 'yellow', 'blue'];
        const assignedColor = colors[room.players.length];
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

  // Sohbet Mesajları
  socket.on('send_message', ({ roomId, message }) => {
    io.to(roomId).emit('receive_message', message);
  });

  // Kızma Birader - Zar Atma
  socket.on('roll_dice', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.gameType === 'ludo') {
      const player = room.players.find(p => p.id === user.id);
      if (player && room.gameState.turn === player.color) {
        const dice = Math.floor(Math.random() * 6) + 1;
        room.gameState.lastDice = dice;
        io.to(roomId).emit('dice_rolled', { user, dice });
        io.to(roomId).emit('receive_message', { user: 'Sistem', text: `${user.username} zarı attı: ${dice}` });
        io.to(roomId).emit('room_state_update', room);
        
        // Hamle yapma mantığı client tarafında değerlendirilip move_pawn çağrılacak.
        // Eğer hiçbir hamle yapılamıyorsa turn geçmeli (bunu basitlik adına frontend'den tetikleyeceğiz)
      }
    }
  });

  socket.on('move_pawn', ({ roomId, user, pawnIndex, newPos }) => {
    const room = rooms[roomId];
    if (room && room.gameType === 'ludo') {
      const player = room.players.find(p => p.id === user.id);
      if (player && room.gameState.turn === player.color) {
        
        // Piyon yeme kontrolü
        if (newPos >= 0 && newPos <= 51) {
          Object.keys(room.gameState.pawns).forEach(color => {
            if (color !== player.color) {
              room.gameState.pawns[color].forEach((pos, idx) => {
                if (pos === newPos) {
                  // Yendi, kaleye gönder
                  room.gameState.pawns[color][idx] = -1;
                  io.to(roomId).emit('receive_message', { user: 'Sistem', text: `${player.username}, ${color} piyonunu kırdı!` });
                }
              });
            }
          });
        }

        // Piyonun pozisyonunu güncelle
        room.gameState.pawns[player.color][pawnIndex] = newPos;
        room.gameState.lastDice = 0; // Zarı sıfırla

        // Turn değiştir (Eğer 6 atılmadıysa)
        // Basitlik için turn değiştirme mantığını burada yapalım, zar atıldığında kaydedilen lastDice'a bakarak
        // Şimdilik sırayı direkt sonraki oyuncuya geçiriyoruz
        const colors = ['red', 'green', 'yellow', 'blue'];
        const currentColorIdx = colors.indexOf(player.color);
        let nextColorIdx = (currentColorIdx + 1) % room.players.length;
        room.gameState.turn = colors[nextColorIdx];

        io.to(roomId).emit('room_state_update', room);
      }
    }
  });

  socket.on('pass_turn', ({ roomId, user }) => {
    const room = rooms[roomId];
    if (room && room.gameType === 'ludo') {
      const player = room.players.find(p => p.id === user.id);
      if (player && room.gameState.turn === player.color) {
        const colors = ['red', 'green', 'yellow', 'blue'];
        const currentColorIdx = colors.indexOf(player.color);
        let nextColorIdx = (currentColorIdx + 1) % room.players.length;
        room.gameState.turn = colors[nextColorIdx];
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
