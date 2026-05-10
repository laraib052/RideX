const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserRepository.findById(decoded.id);
      if (!user) return next(new Error('User not found'));
      if (user.isBlocked) return next(new Error('Account suspended'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`🔌 Socket connected: ${user.name} (${user.role})`);

    // ✅ Personal room
    socket.join(`user_${user._id}`);

    // ✅ Driver apna room join kare
    if (user.role === 'driver') {
      socket.join(`driver_${user._id}`);
      logger.info(`🚗 Driver joined room: driver_${user._id}`);
    }

    // Load ride/bid socket events
    require('./ride.socket')(socket, io);
    require('./bid.socket')(socket, io);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${user.name}`);
    });
  });

  logger.info(' Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };