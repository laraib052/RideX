const Ride = require('../models/Ride.model');

class RideRepository {
  async create(data) {
    return Ride.create(data);
  }

  async findById(id) {
    return Ride.findById(id)
      .populate('rider', 'name phone profilePhoto rating')
      .populate('driver', 'name phone profilePhoto rating')
      .populate('driverProfile');
  }

  async findByIdRaw(id) {
    return Ride.findById(id);
  }

  async updateStatus(rideId, status, extraData = {}) {
    const timelineKey = {
      accepted: 'timeline.acceptedAt',
      driver_arrived: 'timeline.driverArrivedAt',
      in_progress: 'timeline.startedAt',
      completed: 'timeline.completedAt',
      cancelled: 'timeline.cancelledAt',
    }[status];

    const update = { status, ...extraData };
    if (timelineKey) update[timelineKey] = new Date();

    return Ride.findByIdAndUpdate(rideId, update, { new: true });
  }

  async getRiderHistory(riderId, page = 1, limit = 10) {
    return Ride.find({ rider: riderId, status: { $in: ['completed', 'cancelled'] } })
      .populate('driver', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async getDriverHistory(driverId, page = 1, limit = 10) {
    return Ride.find({ driver: driverId, status: { $in: ['completed', 'cancelled'] } })
      .populate('rider', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async getActiveRide(userId) {
    return Ride.findOne({
      $or: [{ rider: userId }, { driver: userId }],
      status: { $in: ['pending', 'bidding', 'accepted', 'driver_arrived', 'in_progress'] },
    });
  }
}

module.exports = new RideRepository();