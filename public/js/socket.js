// socket.js
const socket = io();

socket.on('connect', () => {
  console.log("Socket connected, ID:", socket.id);
});

socket.on('disconnect', () => {
  console.log("Socket disconnected");
});


function initSocket() {
  socket.on('connect', () => {
    localSocketId = socket.id;
    updateConnectionIndicator(true);

    // Eğer kullanıcı daha önce kanala katılmışsa, yeniden katıl
    if (window.joinedChannel) {
      socket.emit('joinChannel', { nickname, channel: 'Genel' });
      // Eğer mikrofona yeniden erişim gerekiyorsa (peer bağlantıları kaybolduysa), yeniden başlatın.
      initVoice();
      showTemporaryMessage("Tekrar bağlandınız");
    }
  });

  socket.on('disconnect', () => {
    updateConnectionIndicator(false);
    showTemporaryMessage("Bağlantı kesildi");
  });

  socket.on('chat message', data => {
    appendChatMessage(data);
    if (data.id !== window.localSocketId) {
      playNotificationSound();
      updateChatBadge(1);
    }
  });

  socket.on('channelUsers', data => { updateUserList(data.users); });

  socket.on('new-user', userData => {
    // Tüm kullanıcılar için join bildirimi
    playUserJoinSound();
    showBrowserNotification("Kullanıcı Katıldı", `${userData.nickname} kanala katıldı.`);
    showTemporaryMessage(`${userData.nickname} katıldı!`);

    // Eğer voice için localStream yoksa, peer bağlantısını başlatmayalım
    if (!localStream) return;

    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: localStream
    });
    peer.on('signal', signalData => {
      socket.emit('signal', { to: userData.id, from: socket.id, signal: signalData, nickname });
    });
    peer.on('stream', remoteStream => {
      addAudioStream(remoteStream, userData.id);
    });
    peers[userData.id] = peer;
  });

  socket.on('signal', data => {
    if (data.to !== socket.id) return;
    if (peers[data.from]) {
      peers[data.from].signal(data.signal);
    } else {
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: localStream
      });
      peer.on('signal', signalData => {
        socket.emit('signal', { to: data.from, from: socket.id, signal: signalData, nickname });
      });
      peer.on('stream', remoteStream => { addAudioStream(remoteStream, data.from); });
      peer.signal(data.signal);
      peers[data.from] = peer;
    }
  });

  socket.on('user-disconnected', user => {
    if (peers[user.id]) {
      peers[user.id].destroy();
      delete peers[user.id];
    }
    if (channelUsers[user.id]) { showTemporaryMessage(`${user.nickname} ayrıldı.`); }
    const li = document.getElementById(`user-${user.id}`);
    if (li) li.remove();
    delete channelUsers[user.id];
    playUserLeaveSound(); // Çıkış sesi veya farklı bildirim sesi
    showBrowserNotification("Kullanıcı Ayrıldı", `${user.nickname} kanaldan ayrıldı.`);
  });
}
