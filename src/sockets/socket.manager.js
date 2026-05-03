const { Server } = require('socket.io');
const admin = require('../config/firebase');
const UserRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Restrict to your domain in production
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // Middleware — authenticate every socket connection using Firebase token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));

      const decoded = await admin.auth().verifyIdToken(token);
      const user = await UserRepository.findByFirebaseUid(decoded.uid);
      if (!user) return next(new Error('User not found'));

      socket.user = user; // Attach user to socket
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`🔌 Socket connected: ${user.name} (${user.role})`);

    // Each user joins a personal room for direct messages
    socket.join(`user_${user._id}`);

    if (user.role === 'driver') {
      socket.join(`driver_${user._id}`);
    }

    // Load ride socket events
    require('./ride.socket')(socket, io);
    require('./bid.socket')(socket, io);

    socket.on('disconnect', () => {
      logger.info(`❌ Socket disconnected: ${user.name}`);
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
};

// Allows services to emit events anywhere in the app
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };