window.addEventListener('DOMContentLoaded', () => {
  // Nickname alınıyor ve DOM'a yazılıyor
  window.nickname = prompt("Lütfen nickinizi girin:") || "Anonim";
  document.getElementById('nicknameDisplay').textContent = window.nickname;

  // Global bayrak: henüz kanala katılmamış
  window.joinedChannel = false;

  // Modülleri başlat
  initSocket();
  initChat();
  initScreenShare();
  initControlPanel();

  // "Genel" kanal tıklama eventi
  document.getElementById('genelChannel').addEventListener('click', () => {
    if (window.joinedChannel) {
      // Eğer zaten kanalda isek, yeniden bağlanma işlemini tetiklemesin
      showTemporaryMessage("Zaten kanalda bağlısınız");
      return;
    }
    window.joinedChannel = true;
    if (socket.disconnected) {
      socket.connect();
    }
    socket.emit('joinChannel', { nickname: window.nickname, channel: 'Genel' });
    controlPanel.style.display = 'flex';
    initVoice();  // Ses modülünü başlat
    showTemporaryMessage("Genel kanala bağlandınız");
  });
});
