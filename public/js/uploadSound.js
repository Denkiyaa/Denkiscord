// uploadSound.js
const multer = require('multer');
const path = require('path');

const soundStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // "public/uploads/soundpanel" dizinine kaydediyor
    cb(null, path.join(__dirname, 'public/uploads/soundpanel'));
  },
  filename: (req, file, cb) => {
    // Dosya adını timestamp ile orijinal adı birleştirerek oluşturuyoruz
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadSound = multer({ storage: soundStorage });
module.exports = uploadSound;
