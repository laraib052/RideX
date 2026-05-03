const DriverRepository = require('../repositories/driver.repository');
const RideRepository = require('../repositories/ride.repository');
const { getIO } = require('../sockets/socket.manager');

class DriverService {
  async createProfile(userId, profileData) {
    const existing = await DriverRepository.findByUserId(userId);
    if (existing) {
      throw Object.assign(new Error('Driver profile already exists'), { statusCode: 409 });
    }
    return DriverRepository.create({ user: userId, ...profileData });
  }

  async getProfile(userId) {
    const profile = await DriverRepository.findByUserId(userId);
    if (!profile) throw Object.assign(new Error('Driver profile not found'), { statusCode: 404 });
    return profile;
  }

  async toggleOnlineStatus(userId, isOnline) {
    const profile = await DriverRepository.findByUserId(userId);
    if (!profile) throw Object.assign(new Error('Profile not found'), { statusCode: 404 });
    if (!profile.isApproved) {
      throw Object.assign(new Error('Profile not approved yet'), { statusCode: 403 });
    }
    await DriverRepository.setOnlineStatus(profile._id, isOnline);
    return { isOnline };
  }

  async updateLocation(userId, longitude, latitude) {
    const profile = await DriverRepository.findByUserId(userId);
    if (!profile) throw Object.assign(new Error('Profile not found'), { statusCode: 404 });

    await DriverRepository.updateLocation(profile._id, longitude, latitude);

    // Broadcast location update to riders tracking this driver
    const io = getIO();
    io.emit(`driver_location_${userId}`, { longitude, latitude });

    return { updated: true };
  }

  async getEarnings(userId) {
    const profile = await DriverRepository.findByUserId(userId);
    if (!profile) throw Object.assign(new Error('Profile not found'), { statusCode: 404 });
    return profile.earnings;
  }

  async getDriverRideHistory(userId, page, limit) {
    return RideRepository.getDriverHistory(userId, page, limit);
  }

  async updateRideStatus(driverId, rideId, status) {
    const ride = await RideRepository.findByIdRaw(rideId);
    if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });
    if (ride.driver.toString() !== driverId.toString()) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    const validTransitions = {
      accepted: ['driver_arrived'],
      driver_arrived: ['in_progress'],
      in_progress: ['completed'],
    };

    if (!validTransitions[ride.status]?.includes(status)) {
      throw Object.assign(
        new Error(`Cannot transition from ${ride.status} to ${status}`),
        { statusCode: 400 }
      );
    }

    const updated = await RideRepository.updateStatus(rideId, status);

    const io = getIO();
    io.to(`ride_${rideId}`).emit('ride_status_updated', { rideId, status });

    return updated;
  }
}

module.exports = new DriverService();