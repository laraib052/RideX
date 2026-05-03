const AdminService = require('../services/admin.service');
const { success } = require('../utils/response.util');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      return success(res, await AdminService.getDashboardStats());
    } catch (err) { next(err); }
  }

  async getUsers(req, res, next) {
    try {
      return success(res, await AdminService.getUsers(req.query));
    } catch (err) { next(err); }
  }

  async getPendingDrivers(req, res, next) {
    try {
      return success(res, await AdminService.getPendingDrivers());
    } catch (err) { next(err); }
  }

  async approveDriver(req, res, next) {
    try {
      const profile = await AdminService.setDriverApproval(req.params.userId, true);
      return success(res, profile, 'Driver approved');
    } catch (err) { next(err); }
  }

  async rejectDriver(req, res, next) {
    try {
      const profile = await AdminService.setDriverApproval(req.params.userId, false);
      return success(res, profile, 'Driver rejected');
    } catch (err) { next(err); }
  }

  async blockUser(req, res, next) {
    try {
      const user = await AdminService.setUserBlock(req.params.userId, true);
      return success(res, user, 'User blocked');
    } catch (err) { next(err); }
  }

  async unblockUser(req, res, next) {
    try {
      const user = await AdminService.setUserBlock(req.params.userId, false);
      return success(res, user, 'User unblocked');
    } catch (err) { next(err); }
  }

  async getAllRides(req, res, next) {
    try {
      return success(res, await AdminService.getAllRides(req.query));
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();