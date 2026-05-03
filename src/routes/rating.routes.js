const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/rating.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const Joi = require('joi');
const { validate } = require('../middlewares/validate.middleware');

const ratingSchema = Joi.object({
  score: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(300).optional(),
});

router.use(requireAuth);
router.post('/ride/:rideId', validate(ratingSchema), RatingController.submitRating);
router.get('/mine', RatingController.getMyRatings);

module.exports = router;