// ══════════════════════════════════════════════
// 1. UPLOAD MIDDLEWARE  (src/middlewares/upload.middleware.js)
// ══════════════════════════════════════════════
// npm install multer

const multer  = require('multer');
const path    = require('path');

// Store files in /uploads/ folder on Railway disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ✅ path.resolve se Linux/Railway par path hamesha 100% absolute aur sahi banega
    cb(null, path.resolve(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase())
          && allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only images/PDFs allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
});

// Fields expected from Flutter driver registration form
const driverDocUpload = upload.fields([
  { name: 'licensePhoto', maxCount: 1 },
  { name: 'cnicFront',    maxCount: 1 },
  { name: 'cnicBack',     maxCount: 1 },
]);

// Note: Ensure your module exports match how you import them in routes!
module.exports = { driverDocUpload };