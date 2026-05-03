const RatingService = require('../services/rating.service');
const { success, created } = require('../utils/response.util');

class RatingController {
  async submitRating(req, res, next) {
    try {
      const rating = await RatingService.submitRating(
        req.user._id,
        req.user.role,
        { rideId: req.params.rideId, ...req.body }
      );
      return created(res, rating, 'Rating submitted');
    } catch (err) { next(err); }
  }

  async getMyRatings(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const ratings = await RatingService.getUserRatings(
        req.user._id, Number(page), Number(limit)
      );
      return success(res, ratings);
    } catch (err) { next(err); }
  }
}

module.exports = new RatingController();