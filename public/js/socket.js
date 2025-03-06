// socket.js
function initSocket() {
    socket.on('connect', () => {
      localSocketId = socket.id;
      updateConnectionIndicator(true);
    });
  
    socket.on('disconnect', () => {
      updateConnectionIndicator(false);
      showTemporaryMessage("Bağlantı kesildi");
    });
  
    socket.on('chat message', data => { appendChatMessage(data); });
  
    socket.on('channelUsers', data => { updateUserList(data.users); });
  
    socket.on('new-user', userData => {
      if (!localStream) return;
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: localStream
      });
      peer.on('signal', signalData => {
        socket.emit('signal', { to: userData.id, from: socket.id, signal: signalData, nickname });
      });
      peer.on('stream', remoteStream => { addAudioStream(remoteStream, userData.id); });
      peers[userData.id] = peer;
      playNotificationSound();
      showTemporaryMessage(`${userData.nickname} katıldı!`);
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
    });
  }
  