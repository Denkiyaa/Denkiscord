// screenShare.js

function initScreenShare() {
    screenShareCtrlBtn.addEventListener('click', async () => {
      if (localScreenStream) {
        localScreenStream.getTracks().forEach(track => track.stop());
        localScreenStream = null;
        screenShareCtrlBtn.textContent = "🖥️ Screen Share";
      } else {
        try {
          localScreenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          screenShareCtrlBtn.textContent = "🛑 Stop Screen Share";
          
          // Mevcut tüm peers için ekran paylaşım peer'ı oluştur
          for (let userId in peers) {
            if (!peers[userId].screenSharePeer) {
              const screenSharePeer = new SimplePeer({
                initiator: true,
                trickle: false,
                stream: localScreenStream
              });
              screenSharePeer.on('signal', signalData => {
                socket.emit('screenShareSignal', { to: userId, from: socket.id, signal: signalData });
              });
              peers[userId].screenSharePeer = screenSharePeer;
            }
          }
  
          // Paylaşım durduğunda
          localScreenStream.getVideoTracks()[0].addEventListener('ended', () => {
            screenShareCtrlBtn.textContent = "🖥️ Screen Share";
          });
        } catch (err) {
          console.error("Ekran paylaşma hatası:", err);
        }
      }
    });
  
    socket.on('screenShareSignal', data => {
      if (data.to !== socket.id) return;
      if (!peers[data.from].screenSharePeer) {
        const screenSharePeer = new SimplePeer({
          initiator: false,
          trickle: false
        });
        screenSharePeer.on('signal', signalData => {
          socket.emit('screenShareSignal', { to: data.from, from: socket.id, signal: signalData });
        });
        screenSharePeer.on('stream', remoteStream => {
          addScreenVideo(remoteStream, data.from);
        });
        peers[data.from].screenSharePeer = screenSharePeer;
      }
      peers[data.from].screenSharePeer.signal(data.signal);
    });
  }
  
  function addScreenVideo(stream, userId) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.controls = true;
    video.id = `screen-video-${userId}`;
    screenVideos.appendChild(video);
  
    // Kullanıcının adının yanına bir simge vs. eklemek isterseniz
    const userElement = document.getElementById(`user-${userId}`);
    if (userElement && !userElement.innerHTML.includes('🖥️')) {
      userElement.innerHTML += ' 🖥️';
    }
  }
  