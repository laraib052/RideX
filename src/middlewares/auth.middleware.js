const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user.repository');
const { error } = require('../utils/response.util');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token provide nahi kiya', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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