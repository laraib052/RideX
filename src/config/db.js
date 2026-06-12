// src/config/db.js
// Forces Mongoose to connect to 'ridex' database, never 'test'

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGODB_URI;

    if (!rawUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // ── Force 'ridex' database ──────────────────────────────────
    // Strips any existing dbName from URI and injects 'ridex'
    // Works for both:
    //   mongodb+srv://user:pass@cluster.mongodb.net/           (no db)
    //   mongodb+srv://user:pass@cluster.mongodb.net/test       (wrong db)
    //   mongodb+srv://user:pass@cluster.mongodb.net/ridex      (correct)
    let uri = rawUri;

    // Remove trailing slash if present
    uri = uri.replace(/\/$/, '');

    // Strip any existing database name after the host
    // Pattern: everything after the last '/' before '?' or end
    const uriWithoutDb = uri.replace(
      /(mongodb(?:\+srv)?:\/\/[^/]+\/)[^?]*/,
      '$1'
    );

    // Append 'ridex' as the target database
    const finalUri = `${uriWithoutDb}ridex`;

    await mongoose.connect(finalUri, {
      // These are recommended for Railway + Atlas
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS:          45000,
      family:                   4,        // Force IPv4 (Railway fix)
    });

    const dbName = mongoose.connection.db.databaseName;
    logger.info(`✅ MongoDB connected → database: "${dbName}"`);

    if (dbName !== 'ridex') {
      logger.warn(`⚠️  WARNING: Connected to "${dbName}" instead of "ridex"!`);
    }

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected — attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected ✅');
    });

  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;