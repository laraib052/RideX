const { error } = require('../utils/response.util');

/**
 * Wraps Joi schemas into Express middleware
 * Usage: validate(myJoiSchema)
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error: joiError } = schema.validate(req.body, {
      abortEarly: false, // Show ALL errors, not just first
      stripUnknown: true, // Remove fields not in schema
    });

    if (joiError) {
      const errors = joiError.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return error(res, 'Validation failed', 422, errors);
    }

    next();
  };
};

module.exports = { validate };