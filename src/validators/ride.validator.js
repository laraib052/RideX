const Joi = require('joi');

const createRideSchema = Joi.object({
  pickupAddress: Joi.string().required(),
  pickupLat: Joi.number().min(-90).max(90).required(),
  pickupLng: Joi.number().min(-180).max(180).required(),
  destAddress: Joi.string().required(),
  destLat: Joi.number().min(-90).max(90).required(),
  destLng: Joi.number().min(-180).max(180).required(),
  suggestedFare: Joi.number().min(1).optional(),
  paymentMethod: Joi.string().valid('cash', 'wallet').default('cash'),
});

const cancelRideSchema = Joi.object({
  reason: Joi.string().max(200).optional(),
});

module.exports = { createRideSchema, cancelRideSchema };