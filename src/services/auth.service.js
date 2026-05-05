const UserRepository = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '45aa441ee8d6522b09c5f20518a1e52067c5a8fea71766e87229141a6c590e791b9e2a49392f50e5abf854e60aa13d143ed77c435a1d58433d5a04bee785b09e';

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
    console.log('JWT_SECRET:', JWT_SECRET ? 'SET ✅' : 'MISSING ❌');
    return jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
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