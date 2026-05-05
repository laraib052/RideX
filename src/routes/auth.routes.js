const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/register', AuthController.register);  // Public
router.post('/login',    AuthController.login);     // Public ✅ YEH MISSING THA
router.get('/profile',   requireAuth, AuthController.getProfile);
router.patch('/fcm-token', requireAuth, AuthController.updateFcmToken);

module.exports = router;