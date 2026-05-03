const { error } = require('../utils/response.util');

// Simple admin check — add isAdmin: true to specific User documents in MongoDB
// For production, use a separate Admin model with its own auth
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return error(res, 'Admin access required', 403);
  }
  next();
};

module.exports = { requireAdmin };