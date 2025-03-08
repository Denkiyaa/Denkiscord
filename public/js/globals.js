/***************
  GLOBAL DEĞİŞKENLER & FONKSİYONLAR
 ***************/

// Burada prompt KALDIRILDI. Nickname’i app.js içindeki DOMContentLoaded içinde alacağız.
// Örneğin: 
//   window.addEventListener('DOMContentLoaded', () => {
//     window.nickname = prompt("Lütfen nickinizi girin:") || "Anonim";
//     document.getElementById('nicknameDisplay').textContent = window.nickname;
//     ... modülleri başlat ...
//   });

window.addEventListener('DOMContentLoaded', () => {
  // Context Menu öğelerini tanımlayın
  const contextMenu = document.getElementById('contextMenu');
  const volumeSlider = document.getElementById('volumeSlider');

  // Volume slider, remote audio elementinin sesini güncelleyecek
  volumeSlider.addEventListener('input', (e) => {
    if (window.currentContextUserId && window.remoteAudioElements[window.currentContextUserId]) {
      window.remoteAudioElements[window.currentContextUserId].volume = e.target.value;
      console.log("Volume updated for user", window.currentContextUserId, "to", e.target.value);
    }
  })

   // openContextMenu fonksiyonunu tanımlıyoruz
   window.openContextMenu = function(e, userId) {
    window.currentContextUserId = userId;
    const audio = window.remoteAudioElements[userId];
    volumeSlider.value = audio ? audio.volume : 1;
    contextMenu.style.left = e.pageX + "px";
    contextMenu.style.top = e.pageY + "px";
    contextMenu.style.display = 'block';
    console.log("Context menu opened for user:", userId);

  };
});

document.addEventListener('click', (e) => {
  const contextMenu = document.getElementById('contextMenu');
  // Eğer tıklanan öğe context menü içerisinde değilse, kapat.
  if (!e.target.closest('#contextMenu')) {
    contextMenu.style.display = 'none';
  }
});
// Socket.IO istemcisini başlat (burada kalabilir veya app.js'e de alabilirsiniz)
window.socket = io();

// Sunucu tarafında "socket.id"yi atayabilmek için
window.localSocketId = null;

// Ses (mic) ve ekran paylaşımı ile ilgili
window.localStream = null;
window.localScreenStream = null;
window.audioContext = null;
window.analyser = null;
window.microphone = null;
window.javascriptNode = null;

// Mikrofon hassasiyeti
window.micSensitivity = 10;

// Peer bağlantılarını tutacağımız obje
window.peers = {};           // { userId: { voicePeer, screenSharePeer } }
window.channelUsers = {};    // { userId: nickname }
window.remoteAudioElements = {}; // { userId: HTMLAudioElement }

// Diğer durum bayrakları
window.isMuted = false;
window.isDeaf = false;

// DOM ELEMENTLERI
window.chatArea = document.getElementById('chatArea');
window.messageInput = document.getElementById('message');
window.sendBtn = document.getElementById('sendBtn');
window.channelUserList = document.getElementById('channelUserList');
window.voiceIndicator = document.getElementById('voiceIndicator');
window.disconnectBtn = document.getElementById('disconnectBtn');
window.muteBtn = document.getElementById('muteBtn');
window.deafBtn = document.getElementById('deafBtn');
window.screenShareCtrlBtn = document.getElementById('screenShareCtrlBtn');
window.screenVideos = document.getElementById('screenVideos');
window.controlPanel = document.getElementById('controlPanel');
window.connectionIndicator = document.getElementById('connectionIndicator');
window.micSensitivitySlider = document.getElementById('micSensitivitySlider');
window.contextMenu = document.getElementById('contextMenu');
window.volumeSlider = document.getElementById('volumeSlider');

// showTemporaryMessage gibi yardımcı fonksiyonları da burada tanımlayabilirsiniz
window.showTemporaryMessage = function(text) {
  const msg = document.createElement('div');
  msg.classList.add('temp-message');
  msg.textContent = text;
  document.body.appendChild(msg);
  setTimeout(() => { msg.remove(); }, 3000);
};
