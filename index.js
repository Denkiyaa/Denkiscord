const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const multer = require('multer');
const path = require('path');
const favicon = require('serve-favicon');
const fs = require('fs');
require('dotenv').config();

const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST,      // .env'de tanımlı
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://dc.craftedfromfilament.com", // veya "*"
    methods: ["GET", "POST"]
  }
});

// Kullanıcıları (socket.id -> { nickname, channel })
let users = {};

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
    const fileUrl = `/uploads/soundpanel/${req.file.filename}`;
    res.json({ fileUrl });
  } else {
    res.status(400).json({ error: 'Dosya yüklenemedi' });
  }
});

// Resim/Video Yükleme Rotası
app.post('/upload', upload.single('media'), (req, res) => {
  if (req.file) {
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

    // Veritabanından mevcut ses listesini çekip gönderin
    db.query("SELECT * FROM sounds", (err, results) => {
      if (err) {
        console.error("Sounds veritabanı hatası:", err);
      } else {
        socket.emit('soundList', results);
      }
    });

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

  socket.on('playSoundEffect', data => {
    const userChannel = users[socket.id].channel;
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

  // Ses paneli için yeni sound ekleme: DB'ye kaydetme
  socket.on('new sound', data => {
    const insertQuery = "INSERT INTO sounds (name, emote, url) VALUES (?, ?, ?)";
    const values = [data.name, data.emote, data.url];
    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("Yeni ses ekleme hatası:", err);
        return;
      }
      // Başarılı ise, yeni sesi tüm kullanıcılara gönderin
      io.emit('new sound', { id: result.insertId, ...data });
    });
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
