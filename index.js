const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// public klasöründeki dosyaları statik olarak sunar
app.use(express.static('public'));

// Kullanıcıları (socket.id -> { nickname, channel }) şeklinde tutacağız
let users = {};

io.on('connection', socket => {
  console.log('Kullanıcı bağlandı: ' + socket.id);

  // Kanal katılımı
  socket.on('joinChannel', data => {
    // data: { nickname, channel }
    users[socket.id] = {
      nickname: data.nickname,
      channel: data.channel
    };
    // Diğer kullanıcılara yeni kullanıcının geldiğini söyle (ses bağlantısı başlatmaları için)
    socket.broadcast.emit('new-user', { id: socket.id, nickname: data.nickname });
    // Herkese güncel kullanıcı listesini gönder
    sendChannelUserList(data.channel);
  });

  // Chat mesajlarını ilet
  socket.on('chat message', data => {
    io.emit('chat message', {
      id: socket.id,
      nickname: data.nickname,
      msg: data.msg
    });
  });

  // WebRTC (mikrofon) sinyalleri
  socket.on('signal', data => {
    // data: { to, from, signal, nickname }
    io.to(data.to).emit('signal', data);
  });

  // Ekran paylaşımı sinyalleri
  socket.on('screenShareSignal', data => {
    // data: { to, from, signal }
    io.to(data.to).emit('screenShareSignal', data);
  });

  // Kullanıcı ayrıldığında
  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı: ' + socket.id);
    if (users[socket.id]) {
      const user = { id: socket.id, nickname: users[socket.id].nickname };
      delete users[socket.id];
      // Herkese bildir
      io.emit('user-disconnected', user);
    }
  });
});

// Kanaldaki kullanıcıların listesini herkese gönderir
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
