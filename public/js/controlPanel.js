// controlPanel.js

function initControlPanel() {
  // Mute butonu
  muteBtn.addEventListener('click', () => {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted;
    });
    // Toggle: İkonu güncelle
    const icon = muteBtn.querySelector('i');
    if (isMuted) {
      icon.classList.remove('fa-microphone');
      icon.classList.add('fa-microphone-slash');
      muteBtn.dataset.title = "Unmute";
    } else {
      icon.classList.remove('fa-microphone-slash');
      icon.classList.add('fa-microphone');
      muteBtn.dataset.title = "Mute";
    }
    socket.emit('muteStatus', { id: socket.id, muted: isMuted, nickname });
    updateLocalMuteIndicator();
  });

  // Deaf butonu
  deafBtn.addEventListener('click', () => {
    isDeaf = !isDeaf;
    const remoteAudios = document.getElementsByClassName('remoteAudio');
    for (let i = 0; i < remoteAudios.length; i++) {
      remoteAudios[i].muted = isDeaf;
    }
    // Toggle: İkonu güncelle
    const icon = deafBtn.querySelector('i');
    if (isDeaf) {
      icon.classList.remove('fa-headphones-simple');
      icon.classList.add('fa-volume-xmark');
      deafBtn.dataset.title = "Undeafen";
    } else {
      icon.classList.remove('fa-volume-xmark');
      icon.classList.add('fa-headphones-simple');
      deafBtn.dataset.title = "Deafen";
    }
    socket.emit('deafStatus', { id: socket.id, deaf: isDeaf, nickname });
    updateLocalDeafIndicator();
  });

  // Disconnect butonu
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

  // Mic Sensitivity Slider
  micSensitivitySlider.addEventListener('input', (e) => {
    micSensitivity = parseInt(e.target.value);
    console.log("Mic sensitivity updated:", micSensitivity);
    showTemporaryMessage(`Mikrofon hassasiyeti: ${micSensitivity}`);
    if (window.microphoneGain) {
      window.microphoneGain.gain.value = micSensitivity / 100;
    }
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
