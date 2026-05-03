const DriverProfile = require('../models/DriverProfile.model');

class DriverRepository {
  async create(data) {
    return DriverProfile.create(data);
  }

  async findByUserId(userId) {
    return DriverProfile.findOne({ user: userId }).populate('user');
  }

  async findById(id) {
    return DriverProfile.findById(id).populate('user');
  }

  async updateById(id, data) {
    return DriverProfile.findByIdAndUpdate(id, data, { new: true });
  }

  async updateLocation(driverProfileId, longitude, latitude) {
    return DriverProfile.findByIdAndUpdate(driverProfileId, {
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude], // lng first — GeoJSON standard
      },
    });
  }

  async setOnlineStatus(driverProfileId, isOnline) {
    return DriverProfile.findByIdAndUpdate(driverProfileId, { isOnline });
  }

  /**
   * Find online + approved drivers within radius km of a point
   * Uses MongoDB's $geoNear / $near for geospatial query
   */
  async findNearbyDrivers(longitude, latitude, radiusKm = 5) {
    return DriverProfile.find({
      isOnline: true,
      isApproved: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000, // Convert to meters
        },
      },
    }).populate('user', 'name phone fcmToken rating');
  }
}

module.exports = new DriverRepository();