const RideService = require('../services/ride.service');
const RideRepository = require('../repositories/ride.repository');
const { success, created } = require('../utils/response.util');

class RideController {
  async createRide(req, res, next) {
    try {
      const ride = await RideService.createRide(req.user._id, req.body);
      return created(res, ride, 'Ride created. Waiting for bids...');
    } catch (err) {
      next(err);
    }
  }

  async getRide(req, res, next) {
    try {
      const ride = await RideService.getRideById(req.params.rideId);
      return success(res, ride);
    } catch (err) {
      next(err);
    }
  }

  async cancelRide(req, res, next) {
    try {
      const ride = await RideService.cancelRide(
        req.params.rideId,
        req.user._id,
        req.body.reason
      );
      return success(res, ride, 'Ride cancelled');
    } catch (err) {
      next(err);
    }
  }

  async completeRide(req, res, next) {
    try {
      const ride = await RideService.completeRide(req.params.rideId, req.user._id);
      return success(res, ride, 'Ride completed');
    } catch (err) {
      next(err);
    }
  }

  async getRideHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const history = await RideRepository.getRiderHistory(
        req.user._id,
        Number(page),
        Number(limit)
      );
      return success(res, history);
    } catch (err) {
      next(err);
    }
  }

  async getActiveRide(req, res, next) {
    try {
      const ride = await RideRepository.getActiveRide(req.user._id);
      return success(res, ride);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RideController();