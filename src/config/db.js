const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options prevent deprecation warnings
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Kill server — no DB = no point running
  }
};

// Reconnect on disconnect (network blip in production)
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Reconnecting...');
  setTimeout(connectDB, 5000);
});

module.exports = connectDB;