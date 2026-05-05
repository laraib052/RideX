const UserRepository = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  async registerUser({ name, email, phone, password, role }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'rider',
    });

    const token = this._generateToken(user);
    return { user: this._sanitize(user), token };
  }

  async loginUser(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('Email ya password galat hai');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Email ya password galat hai');

    const token = this._generateToken(user);
    return { user: this._sanitize(user), token };
  }

  async getUserProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return this._sanitize(user);
  }

  async updateFcmToken(userId, fcmToken) {
    return UserRepository.updateFcmToken(userId, fcmToken);
  }

  _generateToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  }

  _sanitize(user) {
    const u = user.toObject ? user.toObject() : { ...user };
    delete u.password;
    return u;
  }
}

module.exports = new AuthService();