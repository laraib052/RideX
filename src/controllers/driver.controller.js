const DriverService = require('../services/driver.service');
const { success, created } = require('../utils/response.util');

class DriverController {
  async createProfile(req, res, next) {
    try {
      const profile = await DriverService.createProfile(req.user._id, req.body);
      return created(res, profile, 'Driver profile created. Awaiting approval.');
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await DriverService.getProfile(req.user._id);
      return success(res, profile);
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const result = await DriverService.toggleOnlineStatus(
        req.user._id,
        req.body.isOnline
      );
      return success(res, result, `You are now ${result.isOnline ? 'online' : 'offline'}`);
    } catch (err) {
      next(err);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const { longitude, latitude } = req.body;
      await DriverService.updateLocation(req.user._id, longitude, latitude);
      return success(res, {}, 'Location updated');
    } catch (err) {
      next(err);
    }
  }

  async getEarnings(req, res, next) {
    try {
      const earnings = await DriverService.getEarnings(req.user._id);
      return success(res, earnings);
    } catch (err) {
      next(err);
    }
  }

  async updateRideStatus(req, res, next) {
    try {
      const ride = await DriverService.updateRideStatus(
        req.user._id,
        req.params.rideId,
        req.body.status
      );
      return success(res, ride, 'Status updated');
    } catch (err) {
      next(err);
    }
  }

  async getRideHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const history = await DriverService.getDriverRideHistory(
        req.user._id,
        Number(page),
        Number(limit)
      );
      return success(res, history);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DriverController();