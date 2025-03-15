// js/soundPanel.js

function initSoundPanel() {
    // Ses Paneli açma butonu (control panelinde Sound butonunu varsayıyoruz)
    const soundPanelBtn = document.getElementById('soundPanelBtn');
    const soundPanel = document.getElementById('soundPanel');
    const addSoundBtn = document.getElementById('addSoundBtn');
    const soundAddModal = document.getElementById('soundAddModal');
    const soundAddCancelBtn = document.getElementById('soundAddCancelBtn');
    const soundAddConfirmBtn = document.getElementById('soundAddConfirmBtn');
    const soundVolumeControl = document.getElementById('soundVolumeControl');
    const soundVolumeSlider = document.getElementById('soundVolumeSlider');

    soundPanelBtn.addEventListener('click', () => {
        if (soundPanel.style.display === 'none' || soundPanel.style.display === '') {
            // Panel boyu
            const panelHeight = 300; // CSS'te height: 300px
            // Buton konumu
            const rect = soundPanelBtn.getBoundingClientRect();
            // Yukarı açılması: top = rect.top - panelHeight - 5
            const topPos = rect.top - panelHeight - 5;
            soundPanel.style.position = 'fixed';
            soundPanel.style.top = topPos + 'px';
            soundPanel.style.left = rect.left + 'px';
            soundPanel.style.display = 'flex';
        } else {
            soundPanel.style.display = 'none';
        }
    });

    // "Add New Sound" butonuna tıklayınca modal aç
    addSoundBtn.addEventListener('click', () => {
        soundAddModal.style.display = 'flex';
    });

    // "Cancel" butonu modal kapatır
    soundAddCancelBtn.addEventListener('click', () => {
        soundAddModal.style.display = 'none';
    });

    // Örneğin, soundAddConfirmBtn event listener'ında:
    soundAddConfirmBtn.addEventListener('click', async () => {
        const name = document.getElementById('soundNameInput').value.trim();
        const emote = document.getElementById('soundEmoteInput').value.trim() || '🔔';
        const file = document.getElementById('soundFileInput').files[0];

        if (!name || !file) {
            alert("Lütfen ses ismi girin ve dosya seçin!");
            return;
        }

        let soundUrl = null;
        try {
            const formData = new FormData();
            formData.append('media', file);
            // Yeni rota: /upload-sound
            const res = await fetch('/upload-sound', { method: 'POST', body: formData });
            const data = await res.json();
            soundUrl = data.fileUrl;
        } catch (err) {
            console.error("Sound upload error:", err);
            return;
        }

        const newSound = { name, emote, url: soundUrl };
        socket.emit('new sound', newSound);

        soundAddModal.style.display = 'none';
        document.getElementById('soundNameInput').value = '';
        document.getElementById('soundEmoteInput').value = '';
        document.getElementById('soundFileInput').value = '';
    });


    // Tıklayınca slider aç/kapa
    soundVolumeControl.addEventListener('click', () => {
        if (soundVolumeSlider.style.display === 'none') {
            soundVolumeSlider.style.display = 'inline-block';
        } else {
            soundVolumeSlider.style.display = 'none';
        }
    });

    // Ses seviyesi slider kontrolü: Bu slider, sound panelinde oynatılacak seslerin volume'unu ayarlayacak.
    soundVolumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        // Global olarak saklanan sesler oynatılırken, volume bu değere ayarlanabilir.
        // Örneğin, her sound cell tıklandığında, new Audio(url).volume = volume;
        // Bu değeri global bir değişkende saklayabilirsiniz:
        window.soundVolume = parseFloat(e.target.value);
    });

    // Gelen ses listesini dinle: Eski sesleri ekrana yerleştir.
    socket.on('soundList', (soundArray) => {
        soundArray.forEach(soundData => addSoundCell(soundData));
    });
    // Yeni eklenen ses için
    socket.on('new sound', (soundData) => {
        addSoundCell(soundData);
    });

    // Sunucudan gelen "playSoundEffect" event'ini dinleyip sesi localde çalıyoruz.
    socket.on('playSoundEffect', (data) => {
        const audio = new Audio(data.url);
        // soundVolume değişkeni varsa, onu kullan; yoksa 1
        audio.volume = (window.soundVolume !== undefined) ? window.soundVolume : 0.5;
        audio.play();
    });
}

function addSoundCell(soundData) {
    const grid = document.getElementById('soundGrid');
    const cell = document.createElement('div');
    cell.className = 'sound-cell';

    // Emote
    const emoteDiv = document.createElement('div');
    emoteDiv.className = 'sound-emote';
    emoteDiv.textContent = soundData.emote;
    cell.appendChild(emoteDiv);

    // Name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'sound-name';
    nameDiv.textContent = soundData.name;
    cell.appendChild(nameDiv);

    // Tıklayınca sunucuya "playSoundEffect" event'i gönderiyoruz
    cell.addEventListener('click', () => {
        socket.emit('playSoundEffect', {
            url: soundData.url,
            name: soundData.name,
            emote: soundData.emote
        });
    });

    grid.appendChild(cell);
}
