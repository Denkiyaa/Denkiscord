// controlPanel.js

function initControlPanel() {
    // Mute butonu: Hem yerel hem de global mute durumunu bildirir.
    muteBtn.addEventListener('click', () => {
      if (!localStream) return;
      isMuted = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      muteBtn.textContent = isMuted ? "🔇 Unmute" : "🔇 Mute";
      // Kendi mute durumunuzu diğerlerine bildir (server broadcast yapacak)
      socket.emit('muteStatus', { id: socket.id, muted: isMuted, nickname });
      // Yerel kullanıcı listesindeki simgeyi güncelle
      updateLocalMuteIndicator();
    });
  
    // Deaf butonu: Hem yerel hem de global deaf durumunu bildirir.
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
    });
  
    // Mic Sensitivity Slider
    micSensitivitySlider.addEventListener('input', (e) => {
      micSensitivity = parseInt(e.target.value);
    });
  }
  
  // Güncelleme fonksiyonları: Kendi mute/deafen durumunu kanal listesinde göster
  function updateLocalMuteIndicator() {
    const li = document.getElementById(`user-${localSocketId}`);
    if (li) {
      if (isMuted) {
        if (!li.innerHTML.includes('⛔')) {
          li.innerHTML += ' ⛔'; // ⛔: Mute simgesi (üzerine çizili mikrofon gibi)
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
          li.innerHTML += ' 🔇'; // 🔇: Deaf simgesi
        }
      } else {
        li.innerHTML = li.innerHTML.replace(' 🔇', '');
      }
    }
  }
  
  // Dışarıdan gelen muteStatus event'leri için güncelleme
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
  
  // Bağlantı indicator güncellemesi: reconnect olaylarını da yakalayalım
  socket.on('reconnect_attempt', () => {
    updateConnectionIndicator(false);
    showTemporaryMessage("Yeniden bağlanılıyor...");
  });
  socket.on('reconnect', () => {
    updateConnectionIndicator(true);
    showTemporaryMessage("Bağlandı");
  });
  
  function updateConnectionIndicator(connected) {
    connectionIndicator.textContent = connected ? "Bağlı" : "Bağlantı kesildi";
    connectionIndicator.style.background = connected ? "green" : "red";
  }
  