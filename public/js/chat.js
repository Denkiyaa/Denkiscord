// chat.js

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

  // Enter tuşuyla gönderme (sendBtn'in callback'inden bağımsız)
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

  // Gizli input'ta dosya seçilince
  hiddenMediaInput.addEventListener('change', async () => {
    // Eğer birden fazla dosya seçilebiliyorsa (input 'multiple' özelliği eklenmişse)
    const files = hiddenMediaInput.files;
    for (let i = 0; i < files.length && pendingFiles.length < 5; i++) {
      await showPastePreview(files[i]);
    }
    hiddenMediaInput.value = '';
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

// Global değişkenler:
let pendingFiles = []; // { file, preview } objeleri saklanacak
let pendingFileType = null;

// Bu fonksiyon, DOM yüklendikten sonra butonlara event listener ekler
function initMediaUpload() {
  const uploadBtn = document.getElementById('uploadBtn');
  const hiddenMediaInput = document.getElementById('hiddenMediaInput');
  const sendBtn = document.getElementById('sendBtn');
  const messageInput = document.getElementById('message');

  if (!uploadBtn || !hiddenMediaInput) {
    console.error("uploadBtn veya hiddenMediaInput bulunamadı!");
    return;
  }
  console.log("pendingFile:", pendingFile);
  // "📎" butonuna tıklayınca gizli input'u tetikle
  uploadBtn.addEventListener('click', () => {
    if (pendingFile) {
      console.log("Dosya zaten seçili, önce iptal edin veya gönderin.");
      return;
    }
    console.log("Upload button clicked");
    hiddenMediaInput.click();
  });

  // Dosya seçildiğinde
  hiddenMediaInput.addEventListener('change', async () => {
    const file = hiddenMediaInput.files[0];
    if (!file) return;
    // İsteğe bağlı: gösterim veya 'pendingFile' saklama
    await showPreview(file);
  });

  // Gönder butonuna tıklayınca: hem metin mesajı hem de varsa pendingFile yollayabilirsiniz
  sendBtn.addEventListener('click', async () => {
    const textMsg = messageInput.value.trim();

    // 1) Dosya varsa önce yükle (örnek)
    if (pendingFile) {
      const url = await uploadFile(pendingFile);
      if (url) {
        // Chat’e image/video mesajı olarak gönder
        let fileType = "image";
        if (pendingFile.type.startsWith("video/")) fileType = "video";

        socket.emit('chat message', {
          nickname,
          type: fileType,
          content: url
        });
      }
      pendingFile = null;
      pendingFileType = null;
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
}

// Örnek: dosya önizleme (isteğe bağlı)
async function showPreview(file) {
  pendingFile = file;
  if (file.type.startsWith("image/")) {
    pendingFileType = "image";
    // isterseniz küçük bir <img> önizlemesi yapabilirsiniz
    console.log("Resim dosyası seçildi:", file.name);
  } else if (file.type.startsWith("video/")) {
    pendingFileType = "video";
    console.log("Video dosyası seçildi:", file.name);
  } else {
    console.log("Desteklenmeyen dosya tipi");
    pendingFile = null;
  }
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
  // Sadece 5'ten fazla dosya eklenmesin
  if (pendingFiles.length >= 5) {
    console.log("En fazla 5 dosya desteklenir.");
    return;
  }
  
  // Belirle: image veya video
  const fileType = file.type.startsWith("image/") ? "image" : "video";
  
  // Önizleme alanını görünür yap
  pastePreviewContainer.style.display = 'flex';

  // Preview öğesi oluştur
  const previewWrapper = document.createElement('div');
  previewWrapper.className = 'preview-item';

  if (fileType === "image") {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      previewWrapper.appendChild(img);
    };
    reader.readAsDataURL(file);
  } else if (fileType === "video") {
    // Video için URL.createObjectURL kullanabiliriz
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;      // Autoplay için gerekli olabilir
    video.playsInline = true;
    video.style.maxWidth = "80px";
    video.style.maxHeight = "80px";
    previewWrapper.appendChild(video);
  }
  
  // Tıklayınca, o preview öğesini kaldırarak dosyayı iptal etsin
  previewWrapper.addEventListener('click', () => {
    // pendingFiles'den kaldır
    pendingFiles = pendingFiles.filter(item => item.preview !== previewWrapper);
    pastePreviewContainer.removeChild(previewWrapper);
    if (pendingFiles.length === 0) {
      pastePreviewContainer.style.display = 'none';
    }
  });
  
  // Önizleme alanına ekle
  pastePreviewContainer.appendChild(previewWrapper);
  pendingFiles.push({ file: file, preview: previewWrapper });
}

function clearPreview() {
  pendingFiles = [];
  pastePreviewContainer.innerHTML = '';
  pastePreviewContainer.style.display = 'none';
}
