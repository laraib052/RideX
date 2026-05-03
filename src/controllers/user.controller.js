const UserRepository = require('../repositories/user.repository');
const RideRepository = require('../repositories/ride.repository');
const { success } = require('../utils/response.util');

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await UserRepository.findById(req.user._id);
      return success(res, user, 'Profile fetched');
    } catch (err) { next(err); }
  }

  async updateProfile(req, res, next) {
    try {
      const allowed = ['name', 'email', 'profilePhoto'];
      const updates = {};
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await UserRepository.updateById(req.user._id, updates);
      return success(res, user, 'Profile updated');
    } catch (err) { next(err); }
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
    } catch (err) { next(err); }
  }

  async getActiveRide(req, res, next) {
    try {
      const ride = await RideRepository.getActiveRide(req.user._id);
      return success(res, ride);
    } catch (err) { next(err); }
  }

  async deleteAccount(req, res, next) {
    try {
      await UserRepository.updateById(req.user._id, {
        isActive: false,
        isBlocked: true,
        name: 'Deleted User',
        phone: `deleted_${req.user._id}`,
      });
      return success(res, {}, 'Account deleted successfully');
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();