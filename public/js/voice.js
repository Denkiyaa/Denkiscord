// voice.js

function initVoice() {
  if (!localStream) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        localStream = stream;
        setupAudioLevelDetection(stream);
        showTemporaryMessage("Mikrofona bağlandınız");
      })
      .catch(err => {
        console.error('Mikrofona erişim hatası:', err);
        showTemporaryMessage("Mikrofona erişim hatası");
      });
  } else {
    showTemporaryMessage("Zaten mikrofona bağlısınız");
  }
}

function setupAudioLevelDetection(stream) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  microphone = audioContext.createMediaStreamSource(stream);

   // GainNode oluşturuluyor ve globalde saklanıyor
   window.microphoneGain = audioContext.createGain();
   // Varsayılan kazanç değeri: 1 (slider değeri 100 olduğunda 1, 0 olduğunda 0)
   window.microphoneGain.gain.value = 1;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  microphone.connect(analyser);

  javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
  analyser.connect(javascriptNode);
  javascriptNode.connect(audioContext.destination);

  javascriptNode.onaudioprocess = () => {
    let array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i];
    }
    const average = sum / array.length;
    
    // micSensitivity global olarak güncelleniyor, eşik değeri olarak kullanıyoruz.
    if (average > micSensitivity) {
      voiceIndicator.classList.add('speaking');
      if (localSocketId) {
        const li = document.getElementById(`user-${localSocketId}`);
        if (li && !li.querySelector('.speaking-indicator')) {
          const indicator = document.createElement('span');
          indicator.className = 'speaking-indicator';
          indicator.textContent = ' 🟢';
          li.appendChild(indicator);
        }
      }
    } else {
      voiceIndicator.classList.remove('speaking');
      if (localSocketId) {
        const li = document.getElementById(`user-${localSocketId}`);
        if (li) {
          const indicator = li.querySelector('.speaking-indicator');
          if (indicator) indicator.remove();
        }
      }
    }
  };
}

function addAudioStream(stream, userId) {
  const audio = document.createElement('audio');
  audio.srcObject = stream;
  audio.classList.add('remoteAudio');
  audio.volume = 1;
  audio.play();
  remoteAudioElements[userId] = audio;
  addRemoteAudioIndicator(audio, userId);
}

function addRemoteAudioIndicator(audioElement, userId) {
  const remoteAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = remoteAudioContext.createMediaElementSource(audioElement);
  const analyser = remoteAudioContext.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  // Eşik değeri için remote audio için de micSensitivity veya farklı bir eşik kullanılabilir.
  const threshold = micSensitivity; // ya da örneğin micSensitivity - 5 gibi

  function updateIndicator() {
    let array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i];
    }
    const average = sum / array.length;
    const userListElement = document.getElementById(`user-${userId}`);
    if (userListElement) {
      if (average > threshold) {
        if (!userListElement.querySelector('.speaking-indicator')) {
          const indicator = document.createElement('span');
          indicator.className = 'speaking-indicator';
          indicator.textContent = ' 🟢';
          userListElement.appendChild(indicator);
        }
      } else {
        const indicator = userListElement.querySelector('.speaking-indicator');
        if (indicator) indicator.remove();
      }
    }
    requestAnimationFrame(updateIndicator);
  }
  updateIndicator();
}
