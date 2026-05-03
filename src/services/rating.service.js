const Rating = require('../models/Rating.model');
const RideRepository = require('../repositories/ride.repository');
const User = require('../models/User.model');

class RatingService {
  async submitRating(userId, userRole, { rideId, score, comment }) {
    const ride = await RideRepository.findByIdRaw(rideId);
    if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });
    if (ride.status !== 'completed') {
      throw Object.assign(new Error('Can only rate completed rides'), { statusCode: 400 });
    }

    // Rider rates driver, driver rates rider
    const isRider = userRole === 'rider';
    const raterId = userId;
    const rateeId = isRider ? ride.driver : ride.rider;

    if (!rateeId) throw Object.assign(new Error('No one to rate'), { statusCode: 400 });

    // Check not already rated
    const existing = await Rating.findOne({ ride: rideId, givenBy: raterId });
    if (existing) throw Object.assign(new Error('Already rated this ride'), { statusCode: 409 });

    const rating = await Rating.create({
      ride: rideId,
      givenBy: raterId,
      givenTo: rateeId,
      score,
      comment,
      raterRole: userRole,
    });

    // Recalculate ratee's average rating
    await this._updateAverageRating(rateeId);

    return rating;
  }

  async _updateAverageRating(userId) {
    const result = await Rating.aggregate([
      { $match: { givenTo: userId } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    if (result.length > 0) {
      await User.findByIdAndUpdate(userId, {
        rating: Math.round(result[0].avg * 10) / 10,
      });
    }
  }

  async getUserRatings(userId, page = 1, limit = 10) {
    return Rating.find({ givenTo: userId })
      .populate('givenBy', 'name profilePhoto')
      .populate('ride', 'pickup destination')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }
}

module.exports = new RatingService();