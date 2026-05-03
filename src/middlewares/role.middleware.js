const { error } = require('../utils/response.util');

/**
 * Usage: requireRole('driver') or requireRole('rider')
 * Always use AFTER verifyFirebaseToken
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Not authenticated', 401);
    }
    if (!roles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role: ${roles.join(' or ')}`,
        403
      );
    }
    next();
  };
};

module.exports = { requireRole };