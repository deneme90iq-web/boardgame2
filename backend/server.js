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
      players: [user],
      maxPlayers,
      creatorId: user.id, // Odayı kuran kişinin ID'si
      gameState: gameType === 'ludo' ? { turn: 0, positions: {} } : { drawnNumbers: [] }
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
      // Kullanıcı zaten odada değilse ekle
      if (!room.players.find(p => p.id === user.id)) {
        room.players.push(user);
      }
      socket.join(roomId);
      io.to(roomId).emit('room_state_update', room);
      io.emit('rooms_list', Object.values(rooms));
      console.log(`Kullanıcı ${user.username} odaya katıldı: ${roomId}`);
    } else if (!room) {
      // Sadece test için geçici oda oluşturma
      socket.join(roomId);
    }
  });

  // Sohbet Mesajları
  socket.on('send_message', ({ roomId, message }) => {
    io.to(roomId).emit('receive_message', message);
  });

  // Kızma Birader - Zar Atma
  socket.on('roll_dice', ({ roomId, user }) => {
    const dice = Math.floor(Math.random() * 6) + 1;
    io.to(roomId).emit('dice_rolled', { user, dice });
    io.to(roomId).emit('receive_message', { user: 'Sistem', text: `${user.username} zarı attı: ${dice}` });
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
