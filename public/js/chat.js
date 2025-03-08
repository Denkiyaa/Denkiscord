// chat.js

function initChat() {
  sendBtn.addEventListener('click', () => {
    const msg = messageInput.value.trim();
    if (msg !== '') {
      // Metin mesajı gönder (varsayılan tip "text")
      socket.emit('chat message', { 
        nickname, 
        type: "text", 
        content: msg 
      });
      messageInput.value = '';
    }
  });

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });
}

/**
 * Gelen mesajı chat alanında render eder.
 * data: { nickname, type: "text"|"image"|"video", content: string }
 */
function appendChatMessage(data) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('chat-message');

  // Gönderenin ismi
  const sender = document.createElement('strong');
  sender.textContent = data.nickname + ": ";
  msgDiv.appendChild(sender);

  if (data.type === "text") {
    const textEl = document.createElement('span');
    textEl.textContent = data.content;
    msgDiv.appendChild(textEl);
  } else if (data.type === "image") {
    const img = document.createElement('img');
    img.src = data.content;
    img.alt = 'Görsel mesaj';
    // Thumbnail boyutu
    img.style.maxWidth = '200px';
    img.style.maxHeight = '200px';
    img.classList.add('chat-image');
    // Tıklandığında lightbox aç
    img.addEventListener('click', () => {
      openLightbox(img.src, false);
    });
    msgDiv.appendChild(img);
  } else if (data.type === "video") {
    const video = document.createElement('video');
    video.src = data.content;
    // Küçük önizlemede otomatik oynatma ve kontrol barı kapalı
    video.controls = false;
    video.autoplay = false;
    video.style.maxWidth = '200px';
    video.style.maxHeight = '200px';
    video.classList.add('chat-video');
    // Tıklandığında lightbox (büyük boy video, kontroller açık) açılır
    video.addEventListener('click', () => {
      openLightbox(video.src, true);
    });
    msgDiv.appendChild(video);
  } else {
    // Bilinmeyen tip için fallback: metin olarak göster
    const fallback = document.createElement('span');
    fallback.textContent = data.content;
    msgDiv.appendChild(fallback);
  }

  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function openLightbox(mediaUrl, isVideo = false) {
  const overlay = document.createElement('div');
  overlay.id = 'lightboxOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 100000;
  overlay.addEventListener('click', () => {
    overlay.remove();
  });

  let mediaElement;
  if (isVideo) {
    mediaElement = document.createElement('video');
    mediaElement.src = mediaUrl;
    mediaElement.controls = true;
    mediaElement.autoplay = false;
    mediaElement.style.maxWidth = '90%';
    mediaElement.style.maxHeight = '90%';
  } else {
    mediaElement = document.createElement('img');
    mediaElement.src = mediaUrl;
    mediaElement.style.maxWidth = '90%';
    mediaElement.style.maxHeight = '90%';
  }

  overlay.appendChild(mediaElement);
  document.body.appendChild(overlay);
}

function updateUserList(users) {
  channelUserList.innerHTML = "";
  for (const user of users) {
    channelUsers[user.id] = user.nickname;
    const li = document.createElement('li');
    li.id = `user-${user.id}`;
    li.textContent = user.nickname;
    // Eğer tıklanan kullanıcı, kendiniz değilse sağ tıklama event'ini ekleyin
    if (user.id !== window.localSocketId) {
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openContextMenu(e, user.id);
      });
    }
    channelUserList.appendChild(li);
  }
}

