// Path: src/routes/auth.routes.js

const express        = require('express');
const router         = express.Router();
const AuthController = require('../controllers/auth.controller');
const { registerDriver } = require('../controllers/auth.controller');
const { requireAuth }    = require('../middlewares/auth.middleware');
const { driverDocUpload } = require('../middlewares/upload.middleware');

router.post('/register',         AuthController.register);                   // Rider
router.post('/register/driver',  driverDocUpload, registerDriver);           // Driver ← NEW
router.post('/login',            AuthController.login);
router.get('/profile',           requireAuth, AuthController.getProfile);
router.patch('/fcm-token',       requireAuth, AuthController.updateFcmToken);

module.exports = router;   // ← only one export, at the bottom                                  
