const User = require('../models/User.model');

class UserRepository {
  async create(data) {
    return User.create(data);
  }

  async findByFirebaseUid(firebaseUid) {
    return User.findOne({ firebaseUid });
  }

  async findById(id) {
    return User.findById(id);
  }

  async findByPhone(phone) {
    return User.findOne({ phone });
  }

  async updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async updateFcmToken(userId, fcmToken) {
    return User.findByIdAndUpdate(userId, { fcmToken });
  }
}

module.exports = new UserRepository(); // Singleton