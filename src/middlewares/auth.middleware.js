const admin = require('../config/firebase');
const UserRepository = require('../repositories/user.repository');
const { error } = require('../utils/response.util');

/**
 * Verifies Firebase ID token sent from Flutter
 * Flutter sends: Authorization: Bearer <firebase_id_token>
 * 
 * After verification, attaches req.user = MongoDB user document
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401);
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Firebase verifies the token — throws if invalid/expired
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Look up our DB user using Firebase UID
    const user = await UserRepository.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      return error(res, 'User not found. Please register first.', 404);
    }

    if (user.isBlocked) {
      return error(res, 'Your account has been suspended.', 403);
    }

    // Attach to request — all downstream controllers can use req.user
    req.user = user;
    req.firebaseUid = decodedToken.uid;

    next();
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return error(res, 'Token expired. Please login again.', 401);
    }
    if (err.code === 'auth/argument-error') {
      return error(res, 'Invalid token.', 401);
    }
    return error(res, 'Authentication failed.', 401);
  }
};

module.exports = { verifyFirebaseToken };