const logger = require('../utils/logger');

/**
 * Global error handler — last middleware in Express chain
 * Catches any error thrown with next(error) from controllers
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} | ${req.method} ${req.url}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key (e.g. duplicate phone)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Default
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = { errorHandler };