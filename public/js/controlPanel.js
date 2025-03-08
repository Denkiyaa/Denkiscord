// controlPanel.js

function initControlPanel() {
  muteBtn.addEventListener('click', () => {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
    muteBtn.textContent = isMuted ? "🔇 Unmute" : "🔇 Mute";
    socket.emit('muteStatus', { id: socket.id, muted: isMuted, nickname });
    updateLocalMuteIndicator();
  });

  deafBtn.addEventListener('click', () => {
    isDeaf = !isDeaf;
    const remoteAudios = document.getElementsByClassName('remoteAudio');
    for (let i = 0; i < remoteAudios.length; i++) {
      remoteAudios[i].muted = isDeaf;
    }
    deafBtn.textContent = isDeaf ? "🙉 Undeaf" : "🙉 Deaf";
    socket.emit('deafStatus', { id: socket.id, deaf: isDeaf, nickname });
    updateLocalDeafIndicator();
  });

  disconnectBtn.addEventListener('click', () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach(track => track.stop());
      localScreenStream = null;
    }
    channelUserList.innerHTML = "";
    showTemporaryMessage("Bağlantı kesildi");
    socket.disconnect();
    controlPanel.style.display = 'none';
    window.joinedChannel = false;
  });

  micSensitivitySlider.addEventListener('input', (e) => {
    micSensitivity = parseInt(e.target.value);
    console.log("Mic sensitivity updated:", micSensitivity);
    showTemporaryMessage(`Mikrofon hassasiyeti: ${micSensitivity}`);
  });

  socket.on('reconnect_attempt', () => {
    updateConnectionIndicator(false);
    showTemporaryMessage("Yeniden bağlanılıyor...");
  });
  socket.on('reconnect', () => {
    updateConnectionIndicator(true);
    showTemporaryMessage("Bağlandı");
  });
}

function updateLocalMuteIndicator() {
  const li = document.getElementById(`user-${localSocketId}`);
  if (li) {
    if (isMuted) {
      if (!li.innerHTML.includes('⛔')) {
        li.innerHTML += ' ⛔';
      }
    } else {
      li.innerHTML = li.innerHTML.replace(' ⛔', '');
    }
  }
}

function updateLocalDeafIndicator() {
  const li = document.getElementById(`user-${localSocketId}`);
  if (li) {
    if (isDeaf) {
      if (!li.innerHTML.includes('🔇')) {
        li.innerHTML += ' 🔇';
      }
    } else {
      li.innerHTML = li.innerHTML.replace(' 🔇', '');
    }
  }
}

function updateConnectionIndicator(connected) {
  connectionIndicator.textContent = connected ? "Bağlı" : "Bağlantı kesildi";
  connectionIndicator.style.background = connected ? "green" : "red";
}

socket.on('muteStatus', data => {
  const li = document.getElementById(`user-${data.id}`);
  if (li) {
    if (data.muted) {
      if (!li.innerHTML.includes('⛔')) {
        li.innerHTML += ' ⛔';
      }
    } else {
      li.innerHTML = li.innerHTML.replace(' ⛔', '');
    }
  }
});

socket.on('deafStatus', data => {
  const li = document.getElementById(`user-${data.id}`);
  if (li) {
    if (data.deaf) {
      if (!li.innerHTML.includes('🔇')) {
        li.innerHTML += ' 🔇';
      }
    } else {
      li.innerHTML = li.innerHTML.replace(' 🔇', '');
    }
  }
});
