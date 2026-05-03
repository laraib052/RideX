const RideRepository = require('../repositories/ride.repository');
const DriverRepository = require('../repositories/driver.repository');
const NotificationService = require('./notification.service');
const { getDistance, estimateFare } = require('../utils/geo.util');
const { getIO } = require('../sockets/socket.manager');
const PaymentService = require('./payment.service');

class RideService {
  async createRide(riderId, { pickupAddress, pickupLng, pickupLat, destAddress, destLng, destLat, suggestedFare }) {
    const activeRide = await RideRepository.getActiveRide(riderId);
    if (activeRide) {
      throw Object.assign(new Error('You already have an active ride'), { statusCode: 409 });
    }

    const distanceKm = getDistance(pickupLat, pickupLng, destLat, destLng);
    const estimatedFare = suggestedFare || estimateFare(distanceKm);

    const ride = await RideRepository.create({
      rider: riderId,
      pickup: {
        address: pickupAddress,
        coordinates: { type: 'Point', coordinates: [pickupLng, pickupLat] },
      },
      destination: {
        address: destAddress,
        coordinates: { type: 'Point', coordinates: [destLng, destLat] },
      },
      suggestedFare: estimatedFare,
      distance: Math.round(distanceKm * 10) / 10,
      timeline: { createdAt: new Date() },
    });

    // Find nearby drivers and notify them
    try {
      const nearbyDrivers = await DriverRepository.findNearbyDrivers(pickupLng, pickupLat, 8);

      if (nearbyDrivers.length > 0) {
        const io = getIO();
        nearbyDrivers.forEach((driverProfile) => {
          io.to(`driver_${driverProfile.user._id}`).emit('new_ride_request', {
            rideId: ride._id,
            pickup: pickupAddress,
            destination: destAddress,
            suggestedFare: estimatedFare,
            distance: ride.distance,
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

  async cancelRide(rideId, userId, reason) {
    const ride = await RideRepository.findByIdRaw(rideId);
    if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });

    const isRider = ride.rider.toString() === userId.toString();
    const isDriver = ride.driver && ride.driver.toString() === userId.toString();

    if (!isRider && !isDriver) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    const cancelledBy = isRider ? 'rider' : 'driver';

    const updated = await RideRepository.updateStatus(rideId, 'cancelled', {
      cancelReason: reason,
      cancelledBy,
    });

    try {
      const io = getIO();
      io.to(`ride_${rideId}`).emit('ride_cancelled', { rideId, cancelledBy, reason });
    } catch (_) {}

    return updated;
  }

  async getRideById(rideId) {
    const ride = await RideRepository.findById(rideId);
    if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });
    return ride;
  }

  async completeRide(rideId, driverId) {
    const ride = await RideRepository.findByIdRaw(rideId);

    if (!ride) {
      throw Object.assign(new Error('Ride not found'), { statusCode: 404 });
    }

    if (ride.driver.toString() !== driverId.toString()) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    if (ride.status !== 'in_progress') {
      throw Object.assign(new Error('Ride is not in progress'), { statusCode: 400 });
    }

    // Step 1: Mark ride completed
    const updated = await RideRepository.updateStatus(rideId, 'completed', {
      paymentStatus: ride.paymentMethod === 'cash' ? 'completed' : 'pending',
    });

    // Step 2: Create payment record
    try {
      await PaymentService.createPaymentRecord(rideId);
    } catch (err) {
      console.error('Payment record creation failed:', err.message);
      // Don't break ride completion if payment fails
    }

    // Step 3: Emit socket event
    try {
      const io = getIO();
      io.to(`ride_${rideId}`).emit('ride_completed', {
        rideId,
        fare: ride.finalFare,
      });
    } catch (_) {}

    return updated;
  }
}

module.exports = new RideService();