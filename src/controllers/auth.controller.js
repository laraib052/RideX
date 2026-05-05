// Path: controllers/auth.controller.js

const AuthService = require('../services/auth.service');
const { success, created } = require('../utils/response.util');

class AuthController {
  // ── USER REGISTRATION ──
  async register(req, res, next) {
    try {
      // Direct req.body bhej rahe hain (name, email, password, phone, role)
      const user = await AuthService.registerUser(req.body);
      
      return created(
        res, 
        user, 
        'User registered successfully. Please verify your email.'
      );
    } catch (err) {
      next(err);
    }
  }

  // ── USER LOGIN ──
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginUser(email, password);
      
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  // ── GET USER PROFILE ──
  async getProfile(req, res, next) {
    try {
      // req.user middleware se aa raha hai
      return success(res, req.user, 'Profile fetched');
    } catch (err) {
      next(err);
    }
  }

  // ── UPDATE FCM TOKEN (For Notifications) ──
  async updateFcmToken(req, res, next) {
    try {
      const { fcmToken } = req.body;
      await AuthService.updateFcmToken(req.user._id, fcmToken);
      
      return success(res, {}, 'FCM token updated');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();