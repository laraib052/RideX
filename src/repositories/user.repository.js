const User = require('../models/User.model'); // ✅ Capital U

class UserRepository {
  findByEmail(email)        { return User.findOne({ email }); }
  findById(id)              { return User.findById(id); }
  create(data)              { return User.create(data); }
  updateFcmToken(id, token) { return User.findByIdAndUpdate(id, { fcmToken: token }); }
}

module.exports = new UserRepository();