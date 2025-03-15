const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');
const favicon = require('serve-favicon');
const fs = require('fs');


const app = express();
const server = http.createServer(app);

require('dotenv').config();

const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const io = new Server(server, {
  cors: {
    origin: "https://dc.craftedfromfilament.com", // veya "*"
    methods: ["GET", "POST"]
  }
});

<<<<<<< HEAD
// Kullanıcıları (socket.id -> { nickname, channel }) şeklinde tutacağız
let users = {};

=======
const soundsFile = path.join(__dirname, 'sounds.json');
>>>>>>> b76fd4a6f706e936e949c5d464c764654a6a5f38
let sounds = []; // Tüm eklenmiş sesler burada saklanacak

// Mevcut sounds.json dosyasını oku (varsa)
if (fs.existsSync(soundsFile)) {
  try {
    const data = fs.readFileSync(soundsFile, 'utf-8');
    sounds = JSON.parse(data);
  } catch (err) {
    console.error("Sounds dosyası okunurken hata oluştu:", err);
    sounds = [];
  }
}

// public klasöründeki dosyaları statik olarak sunar
app.use(express.static('public'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Ses dosyaları için özel multer instance'ı: public/uploads/soundpanel içine kaydedilsin
const soundStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads/soundpanel'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadSound = multer({ storage: soundStorage });

// Ses dosyası yükleme rotası
app.post('/upload-sound', uploadSound.single('media'), (req, res) => {
  if (req.file) {
    // public dizin statik sunulduğundan, dosya URL'si:
    const fileUrl = `/uploads/soundpanel/${req.file.filename}`;
    res.json({ fileUrl });
  } else {
    res.status(400).json({ error: 'Dosya yüklenemedi' });
  }
});

io.on('connection', socket => {
  console.log('Kullanıcı bağlandı: ' + socket.id);

  socket.on('joinChannel', data => {
    users[socket.id] = {
      nickname: data.nickname,
      channel: data.channel
    };
    socket.broadcast.emit('new-user', { id: socket.id, nickname: data.nickname });
    sendChannelUserList(data.channel);
    // Yeni kullanıcıya mevcut ses listesini gönderin:
    socket.emit('soundList', sounds);
    socket.join(data.channel);
  });

  socket.on('chat message', data => {
    io.emit('chat message', {
      id: socket.id,
      nickname: data.nickname,
      type: data.type || "text",
      content: data.content || data.msg
    });
  });

  // "playSoundEffect" event listener'ını ayrı tanımlayın:
  socket.on('playSoundEffect', data => {
    // data: { url, name, emote, ... }
    // Kullanıcının kanalı
    const userChannel = users[socket.id].channel;
    // Aynı kanaldaki herkese yayın yapıyoruz:
    io.to(userChannel).emit('playSoundEffect', data);
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

  // Ses paneli için yeni sound ekleme
  socket.on('new sound', data => {
    sounds.push(data);
    fs.writeFile(soundsFile, JSON.stringify(sounds, null, 2), (err) => {
      if (err) {
        console.error("Sounds dosyası kaydedilirken hata oluştu:", err);
      }
    });
    io.emit('new sound', data);
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
