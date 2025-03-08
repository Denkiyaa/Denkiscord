const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// public klasöründeki dosyaları statik olarak sunar
app.use(express.static('public'));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Kullanıcıları (socket.id -> { nickname, channel }) şeklinde tutacağız
let users = {};

// Multer konfigürasyonu: Dosyalar public/uploads klasörüne kaydedilecek
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Görsel / Video Yükleme Rotası
app.post('/upload', upload.single('media'), (req, res) => {
  if (req.file) {
    // Public klasör statik sunulduğundan, dosya URL'si aşağıdaki gibidir:
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } else {
    res.status(400).json({ error: "Dosya yüklenemedi" });
  }
});

// Socket.IO eventleri
io.on('connection', socket => {
  console.log('Kullanıcı bağlandı: ' + socket.id);

  socket.on('joinChannel', data => {
    users[socket.id] = {
      nickname: data.nickname,
      channel: data.channel
    };
    socket.broadcast.emit('new-user', { id: socket.id, nickname: data.nickname });
    sendChannelUserList(data.channel);
  });

  socket.on('chat message', data => {
    // Her mesajın içinde type ve content alanı olsun:
    // Örneğin, { nickname, type: "text"|"image"|"video", content }
    // Eğer text mesajı gönderiliyorsa, type "text" ve content metin olur.
    io.emit('chat message', {
      id: socket.id,
      nickname: data.nickname,
      type: data.type || "text",
      content: data.content || data.msg
    });
  });

  socket.on('signal', data => {
    io.to(data.to).emit('signal', data);
  });

  socket.on('screenShareSignal', data => {
    io.to(data.to).emit('screenShareSignal', data);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı: ' + socket.id);
    if (users[socket.id]) {
      const user = { id: socket.id, nickname: users[socket.id].nickname };
      delete users[socket.id];
      io.emit('user-disconnected', user);
    }
  });
});

function sendChannelUserList(channelName) {
  const channelUsersList = Object.entries(users)
    .filter(([_, u]) => u.channel === channelName)
    .map(([id, u]) => ({ id, nickname: u.nickname }));
  io.emit('channelUsers', {
    channel: channelName,
    users: channelUsersList
  });
}

server.listen(1337, () => {
  console.log('Sunucu çalışıyor: http://localhost:1337');
});
