const AuthService = require('../services/auth.service');
const { success, created, error } = require('../utils/response.util');

class AuthController {
  async register(req, res, next) {
    try {
      // req.firebaseUid comes from verifyFirebaseToken middleware
      const user = await AuthService.registerUser({
        firebaseUid: req.firebaseUid,
        ...req.body,
      });
      return created(res, user, 'User registered successfully');
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      // req.user already set by middleware
      return success(res, req.user, 'Profile fetched');
    } catch (err) {
      next(err);
    }
  }

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