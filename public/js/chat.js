function initChat() {
  // Gönder butonuna tıklama
  sendBtn.addEventListener('click', async () => {
    const textMsg = messageInput.value.trim();

    // 1) Pending dosyalar varsa önce yükle
    if (pendingFiles.length > 0) {
      // Tüm pendingFiles için ayrı ayrı upload işlemi yapalım
      for (let fileObj of pendingFiles) {
        const url = await uploadFile(fileObj.file);
        if (url) {
          let fileType = "image";
          if (fileObj.file.type.startsWith("video/")) fileType = "video";
          socket.emit('chat message', {
            nickname,
            type: fileType,
            content: url
          });
        }
      }
      clearPreview();
    }

    // 2) Metin mesajı varsa gönder
    if (textMsg) {
      socket.emit('chat message', {
        nickname,
        type: "text",
        content: textMsg
      });
      messageInput.value = '';
    }
  });

  // Enter tuşuyla gönderme
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // CTRL+V ile yapıştırma
  document.addEventListener('paste', async (e) => {
    if (e.clipboardData?.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
            await showPastePreview(file);
          }
        }
      }
    }
  });

  // Upload butonuna tıklayınca gizli input'u tetikle (eğer pendingFiles doluysa, tekrar seçim açılmasın)
  uploadBtn.addEventListener('click', () => {
    if (pendingFiles.length > 0) {
      console.log("Dosya(lar) zaten seçili, önce iptal edin veya gönderin.");
      return;
    }
    console.log("Upload button clicked");
    hiddenMediaInput.click();
  });

  // Gizli input'ta dosya seçilince (multiple attribute'ı ekli)
  hiddenMediaInput.addEventListener('change', async () => {
    const files = hiddenMediaInput.files;
    for (let i = 0; i < files.length && pendingFiles.length < 5; i++) {
      await showPastePreview(files[i]);
    }
    hiddenMediaInput.value = '';
  });
}

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
    img.style.maxWidth = '200px';
    img.style.maxHeight = '200px';
    img.classList.add('chat-image');
    img.addEventListener('click', () => {
      openLightbox(img.src, false);
    });
    msgDiv.appendChild(img);
  } else if (data.type === "video") {
    const video = document.createElement('video');
    video.src = data.content;
    video.controls = false;
    video.autoplay = false;
    video.style.maxWidth = '200px';
    video.style.maxHeight = '200px';
    video.classList.add('chat-video');
    video.addEventListener('click', () => {
      openLightbox(video.src, true);
    });
    msgDiv.appendChild(video);
  } else {
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
    if (user.id !== window.localSocketId) {
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openContextMenu(e, user.id);
      });
    }
    channelUserList.appendChild(li);
  }
}

// Global değişkenler: pendingFiles dizisini kullanıyoruz.
let pendingFiles = [];

// initMediaUpload fonksiyonunu initChat içinde veya ayrı olarak çağırın.
function initMediaUpload() {
  const uploadBtn = document.getElementById('uploadBtn');
  const hiddenMediaInput = document.getElementById('hiddenMediaInput');

  if (!uploadBtn || !hiddenMediaInput) {
    console.error("uploadBtn veya hiddenMediaInput bulunamadı!");
    return;
  }

  uploadBtn.addEventListener('click', () => {
    if (pendingFiles.length > 0) {
      console.log("Dosya(lar) zaten seçili, önce iptal edin veya gönderin.");
      return;
    }
    console.log("Upload button clicked");
    hiddenMediaInput.click();
  });

  hiddenMediaInput.addEventListener('change', async () => {
    const files = hiddenMediaInput.files;
    for (let i = 0; i < files.length && pendingFiles.length < 5; i++) {
      await showPastePreview(files[i]);
    }
    hiddenMediaInput.value = '';
  });
}

async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('media', file);
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.fileUrl) {
      console.log("Dosya yüklendi, URL:", data.fileUrl);
      return data.fileUrl;
    }
  } catch (err) {
    console.error("Yükleme hatası:", err);
  }
  return null;
}

async function showPastePreview(file) {
  // Eğer 5 dosya sınırını aşarsa, eklemeyi engelle
  if (pendingFiles.length >= 5) {
    console.log("En fazla 5 dosya desteklenir.");
    return;
  }

  const fileType = file.type.startsWith("image/") ? "image" : "video";
  pastePreviewContainer.style.display = 'flex';
  const previewWrapper = document.createElement('div');
  previewWrapper.className = 'preview-item';
  previewWrapper.style.position = 'relative';

  if (fileType === "image") {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Önizleme';
      previewWrapper.appendChild(img);
      img.addEventListener('click', () => {
        openLightbox(img.src, false);
      });
    };
    reader.readAsDataURL(file);
  } else if (fileType === "video") {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.style.maxWidth = "80px";
    video.style.maxHeight = "80px";
    previewWrapper.appendChild(video);
    video.addEventListener('click', () => {
      openLightbox(video.src, true);
    });
  }

  // Kapatma butonu
  const removeBtn = document.createElement('span');
  removeBtn.className = 'preview-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pendingFiles = pendingFiles.filter(item => item.preview !== previewWrapper);
    pastePreviewContainer.removeChild(previewWrapper);
    if (pendingFiles.length === 0) {
      pastePreviewContainer.style.display = 'none';
    }
  });
  previewWrapper.appendChild(removeBtn);

  pastePreviewContainer.appendChild(previewWrapper);
  pendingFiles.push({ file: file, preview: previewWrapper });
}

function clearPreview() {
  pendingFiles = [];
  pastePreviewContainer.innerHTML = '';
  pastePreviewContainer.style.display = 'none';
}
