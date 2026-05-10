const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user.repository');
const { error } = require('../utils/response.util');

const JWT_SECRET = process.env.JWT_SECRET || '45aa441ee8d6522b09c5f20518a1e52067c5a8fea71766e87229141a6c590e791b9e2a49392f50e5abf854e60aa13d143ed77c435a1d58433d5a04bee785b09e';

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token provide nahi kiya', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = jwt.verify(token, JWT_SECRET); // ✅ Same secret

    const user = await UserRepository.findById(decoded.id);
    if (!user) return error(res, 'User nahi mila', 404);
    if (user.isBlocked) return error(res, 'Account suspended', 403);

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Invalid ya expired token', 401);
  }
};

module.exports = { requireAuth };