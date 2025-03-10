window.addEventListener('DOMContentLoaded', () => {
  // Nickname alınıyor ve DOM'a yazılıyor
  window.nickname = prompt("Lütfen nickinizi girin:") || "Anonim";
  document.getElementById('nicknameDisplay').textContent = window.nickname;

  // Global bayrak
  window.joinedChannel = false;

  // Modülleri başlat
  initSocket();
  initChat();
  initScreenShare();
  initControlPanel();
  initSoundPanel();

  // "Genel" kanala tıklama eventi
  document.getElementById('genelChannel').addEventListener('click', () => {
    if (window.joinedChannel) {
      showTemporaryMessage("Zaten kanalda bağlısınız");
      return;
    }
    window.joinedChannel = true;
    if (socket.disconnected) {
      socket.connect();
    }
    socket.emit('joinChannel', { nickname: window.nickname, channel: 'Genel' });
    controlPanel.style.display = 'flex';
    initVoice(); // Ses modülünü başlatır
    showTemporaryMessage("Genel kanala bağlandınız");
  });

  document.getElementById('micSensitivityControl').addEventListener('click', () => {
    const slider = document.getElementById('micSensitivitySlider');
    if (slider.style.display === 'none') {
      slider.style.display = 'inline-block';
    } else {
      slider.style.display = 'none';
    }
  });
});
