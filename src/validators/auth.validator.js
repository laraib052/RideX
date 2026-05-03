const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifyFirebaseToken } = require('../middlewares/auth.middleware');

// POST /api/auth/register
// Body: { name, phone, email, role }
// Header: Authorization: Bearer <firebase_token>
router.post('/register', verifyFirebaseToken, AuthController.register);

// GET /api/auth/profile
router.get('/profile', verifyFirebaseToken, AuthController.getProfile);

// PATCH /api/auth/fcm-token
router.patch('/fcm-token', verifyFirebaseToken, AuthController.updateFcmToken);

module.exports = router;