const UserRepository = require('../repositories/user.repository');
const DriverRepository = require('../repositories/driver.repository');

class AuthService {
  async registerUser({ firebaseUid, name, phone, email, role }) {
    // Check if already registered
    const existing = await UserRepository.findByFirebaseUid(firebaseUid);
    if (existing) {
      // Update FCM token on re-login
      return existing;
    }

    const user = await UserRepository.create({
      firebaseUid,
      name,
      phone,
      email,
      role,
    });

    return user;
  }

  async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateFcmToken(userId, fcmToken) {
    return UserRepository.updateFcmToken(userId, fcmToken);
  }
}

module.exports = new AuthService();