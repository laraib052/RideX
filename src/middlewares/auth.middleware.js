const admin = require('../config/firebase');
const { error } = require('../utils/response.util');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401);
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUid = decodedToken.uid;
    req.decodedToken = decodedToken;

    try {
      const UserRepository = require('../repositories/user.repository');
      const user = await UserRepository.findByFirebaseUid(decodedToken.uid);
      if (user) {
        if (user.isBlocked) return error(res, 'Account suspended.', 403);
        req.user = user;
      }
    } catch (_) {}

    next();
  } catch (err) {
    if (err.code === 'auth/id-token-expired') return error(res, 'Token expired.', 401);
    return error(res, 'Authentication failed.', 401);
  }
};

const requireAuth = async (req, res, next) => {
  await verifyFirebaseToken(req, res, async () => {
    if (!req.user) return error(res, 'User not registered. Please sign up first.', 404);
    next();
  });
};

// IMPORTANT: dono export hone chahiye
module.exports = { verifyFirebaseToken, requireAuth };