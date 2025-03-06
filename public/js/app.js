window.addEventListener('DOMContentLoaded', () => {
    // Tek sefer prompt: nickname alınıyor ve DOM'a yazılıyor
    window.nickname = prompt("Lütfen nickinizi girin:") || "Anonim";
    document.getElementById('nicknameDisplay').textContent = window.nickname;
  
    // Global bayrak: henüz kanala katılmadıysa false, katıldıysa true
    window.joinedChannel = false;
  
    // Modülleri başlatıyoruz
    initSocket();
    initChat();
    initScreenShare();
    initControlPanel();
  
    // "Genel" kanala tıklama eventi
    document.getElementById('genelChannel').addEventListener('click', () => {
      if (window.joinedChannel) {
        // Eğer zaten kanalda isek yeniden bağlanmaya çalışmayalım
        showTemporaryMessage("Zaten kanalda bağlısınız");
        return;
      }
      window.joinedChannel = true; // İlk defa katılıyorsak bayrağı true yapıyoruz
  
      // Eğer socket bağlantısı kesildiyse yeniden bağlanıyoruz
      if (socket.disconnected) {
        socket.connect();
      }
      // Sunucuya kanala katılma isteği gönderiliyor
      socket.emit('joinChannel', { nickname, channel: 'Genel' });
      controlPanel.style.display = 'flex'; // Kontrol panelini görünür yap
      initVoice();  // Ses modülünü başlat
      showTemporaryMessage("Genel kanala bağlandınız");
    });
  });
  