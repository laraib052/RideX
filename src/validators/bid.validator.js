const Joi = require('joi');

const placeBidSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  message: Joi.string().max(200).optional(),
});

module.exports = { placeBidSchema };