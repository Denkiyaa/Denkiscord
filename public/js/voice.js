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
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    microphone.connect(analyser);
  
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);
  
    javascriptNode.onaudioprocess = () => {
      let array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      let values = 0;
      for (let i = 0; i < array.length; i++) {
        values += array[i];
      }
      let average = values / array.length;
      // Eğer ortalama değeri, micSensitivity (veya 10) eşiğini aşarsa
      if (average > micSensitivity) { // micSensitivity global olarak app.js veya globals.js'den ayarlanıyor
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
  
    // Eşik değerini 10 olarak ayarladık
    const threshold = 10;
  
    function updateIndicator() {
      let array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      let values = 0;
      for (let i = 0; i < array.length; i++) {
        values += array[i];
      }
      let average = values / array.length;
      // Debug için:
      // console.log(`User ${userId} average: ${average}`);
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
  