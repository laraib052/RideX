const RideService = require('../services/ride.service');
const RideRepository = require('../repositories/ride.repository');
const { success, created } = require('../utils/response.util');

class RideController {
  
  async createRide(riderId, body) {
  const activeRide = await RideRepository.getActiveRide(riderId);
  if (activeRide) {
    throw Object.assign(new Error('You already have an active ride'), { statusCode: 409 });
  }

  // ✅ Flutter dono formats support karo
  const pickupAddress = body.pickupAddress || body.pickup?.address || '';
  const pickupLat     = body.pickupLat     || body.pickup?.latitude  || 0;
  const pickupLng     = body.pickupLng     || body.pickup?.longitude || 0;
  const destAddress   = body.destAddress   || body.dropoff?.address  || body.destination?.address || '';
  const destLat       = body.destLat       || body.dropoff?.latitude  || body.destination?.latitude  || 0;
  const destLng       = body.destLng       || body.dropoff?.longitude || body.destination?.longitude || 0;
  const suggestedFare = body.suggestedFare || body.fareOffered || 0;
  const vehicleType   = body.vehicleType   || 'taxi';

  const distanceKm    = getDistance(pickupLat, pickupLng, destLat, destLng);
  const estimatedFare = suggestedFare || estimateFare(distanceKm);

  const ride = await RideRepository.create({
    rider: riderId,
    vehicleType,
    pickup: {
      address: pickupAddress,
      coordinates: { type: 'Point', coordinates: [pickupLng, pickupLat] },
    },
    destination: {
      address: destAddress,
      coordinates: { type: 'Point', coordinates: [destLng, destLat] },
    },
    suggestedFare: estimatedFare,
    fareOffered:   estimatedFare,
    distance: Math.round(distanceKm * 10) / 10,
    timeline: { createdAt: new Date() },
  });

  // Nearby drivers notify karo
  try {
    const nearbyDrivers = await DriverRepository.findNearbyDrivers(pickupLng, pickupLat, 8);
    if (nearbyDrivers.length > 0) {
      const io = getIO();
      nearbyDrivers.forEach((driverProfile) => {
        io.to(`driver_${driverProfile.user._id}`).emit('new_ride_request', {
          rideId:        ride._id,
          pickup:        pickupAddress,
          destination:   destAddress,
          suggestedFare: estimatedFare,
          distance:      ride.distance,
          vehicleType,
        });
      });

      const tokens = nearbyDrivers.map((d) => d.user.fcmToken).filter(Boolean);
      await NotificationService.sendToMultiple(
        tokens,
        '🚗 New Ride Request!',
        `Pickup: ${pickupAddress}`,
        { type: 'NEW_RIDE', rideId: String(ride._id) }
      );
    }
  } catch (_) {}

  return ride;
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