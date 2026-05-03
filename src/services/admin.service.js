const User = require('../models/User.model');
const DriverProfile = require('../models/DriverProfile.model');
const Ride = require('../models/Ride.model');
const Payment = require('../models/Payment.model');

class AdminService {
  // Approve or reject a driver
  async setDriverApproval(driverUserId, isApproved) {
    const profile = await DriverProfile.findOneAndUpdate(
      { user: driverUserId },
      { isApproved },
      { new: true }
    ).populate('user', 'name phone email');

    if (!profile) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
    return profile;
  }

  // Block or unblock any user
  async setUserBlock(userId, isBlocked) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked },
      { new: true }
    ).select('-fcmToken');

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  // All users with pagination + role filter
  async getUsers({ page = 1, limit = 20, role, isBlocked }) {
    const filter = {};
    if (role) filter.role = role;
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-fcmToken -firebaseUid')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, total, page: Number(page), pages: Math.ceil(total / limit) };
  }

  // All drivers pending approval
  async getPendingDrivers() {
    return DriverProfile.find({ isApproved: false })
      .populate('user', 'name phone email createdAt')
      .sort({ createdAt: -1 });
  }

  // Platform-wide stats
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDrivers,
      totalRides,
      todayRides,
      completedRides,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments({ role: 'rider' }),
      User.countDocuments({ role: 'driver' }),
      Ride.countDocuments(),
      Ride.countDocuments({ createdAt: { $gte: today } }),
      Ride.countDocuments({ status: 'completed' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      totalUsers,
      totalDrivers,
      totalRides,
      todayRides,
      completedRides,
      cancelledRides: totalRides - completedRides,
      totalRevenue: totalRevenue[0]?.total || 0,
      completionRate: totalRides
        ? Math.round((completedRides / totalRides) * 100)
        : 0,
    };
  }

  // Recent rides for admin view
  async getAllRides({ page = 1, limit = 20, status }) {
    const filter = status ? { status } : {};
    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .populate('rider', 'name phone')
        .populate('driver', 'name phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ride.countDocuments(filter),
    ]);
    return { rides, total, page: Number(page), pages: Math.ceil(total / limit) };
  }
}

module.exports = new AdminService();