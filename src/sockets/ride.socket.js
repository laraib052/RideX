// src/sockets/ride.socket.js
// Handles: create_ride_request → broadcast → accept_ride → live tracking → status updates

const RideRepository   = require('../repositories/ride.repository');
const DriverRepository = require('../repositories/driver.repository');
const logger           = require('../utils/logger');

module.exports = (socket, io) => {

  // ─────────────────────────────────────────────────────────────
  // EVENT: create_ride_request
  // Emitted by: RIDER on "Confirm Selection"
  // Flow: Save ride → confirm to rider → broadcast to nearby drivers
  // ─────────────────────────────────────────────────────────────
  socket.on('create_ride_request', async (data) => {
    if (socket.user.role !== 'rider') return;

    const {
      pickupAddress, pickupLat, pickupLng,
      destAddress,   destLat,   destLng,
      suggestedFare, vehicleType,
    } = data;

    logger.info(`🚗 Ride request from rider: ${socket.user.name} (${socket.user._id})`);

    try {
      // ── 1. Block duplicate active rides ──
      const active = await RideRepository.getActiveRide(socket.user._id);
      if (active) {
        socket.emit('ride_request_error', {
          message: 'You already have an active ride.',
        });
        return;
      }

      // ── 2. Save ride to MongoDB (ridex DB) ──
      const ride = await RideRepository.create({
        rider: socket.user._id,
        pickup: {
          address:     pickupAddress,
          coordinates: { type: 'Point', coordinates: [pickupLng, pickupLat] },
        },
        destination: {
          address:     destAddress,
          coordinates: { type: 'Point', coordinates: [destLng, destLat] },
        },
        suggestedFare,
        vehicleType:  vehicleType || 'sedan',
        status:       'searching',
        timeline:     { createdAt: new Date() },
      });

      logger.info(`✅ Ride saved: ${ride._id}`);

      // ── 3. Rider joins ride room (receives all updates for this ride) ──
      socket.join(`ride_${ride._id}`);

      // ── 4. Confirm to rider — show "Searching" UI ──
      socket.emit('ride_request_created', {
        rideId:        ride._id.toString(),
        status:        'searching',
        suggestedFare,
        pickupAddress,
        destAddress,
      });

      // ── 5. Find nearby online drivers (8km radius) ──
      const nearbyDrivers = await DriverRepository.findNearbyDrivers(
        pickupLng, pickupLat, 8
      );

      logger.info(`📍 Found ${nearbyDrivers.length} nearby drivers`);

      if (nearbyDrivers.length === 0) {
        socket.emit('no_drivers_found', {
          message: 'No drivers nearby. Please try again.',
        });
        return;
      }

      // ── 6. Broadcast to each driver's personal socket room ──
      nearbyDrivers.forEach((driverProfile) => {
        const driverId = driverProfile.user._id.toString();
        io.to(`driver_${driverId}`).emit('new_ride_request', {
          rideId:       ride._id.toString(),
          pickup:       pickupAddress,
          destination:  destAddress,
          pickupLat,
          pickupLng,
          destLat,
          destLng,
          suggestedFare,
          vehicleType:  vehicleType || 'sedan',
          riderId:      socket.user._id.toString(),
          riderName:    socket.user.name,
          riderPhone:   socket.user.phone || '',
        });
        logger.info(`📢 Notified driver: ${driverId}`);
      });

    } catch (err) {
      logger.error(`Ride request error: ${err.message}`);
      socket.emit('ride_request_error', {
        message: 'Could not create ride. Try again.',
      });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // EVENT: accept_ride
  // Emitted by: DRIVER on "Accept" button
  // Flow: Update DB → notify rider → both go to live tracking
  // ─────────────────────────────────────────────────────────────
  socket.on('accept_ride', async ({ rideId, bidAmount }) => {
    if (socket.user.role !== 'driver') return;

    logger.info(`✅ Driver ${socket.user.name} accepting ride ${rideId}`);

    try {
      const ride = await RideRepository.findByIdRaw(rideId);
      if (!ride) {
        socket.emit('accept_ride_error', { message: 'Ride not found.' });
        return;
      }

      // Guard: only accept if still open
      if (!['searching', 'pending'].includes(ride.status)) {
        socket.emit('accept_ride_error', { message: 'Ride already taken.' });
        return;
      }

      const finalFare = bidAmount || ride.suggestedFare;

      // ── Update ride in DB ──
      await RideRepository.updateStatus(rideId, 'accepted', {
        driver:              socket.user._id,
        finalFare,
        'timeline.acceptedAt': new Date(),
      });

      // ── Driver joins ride room ──
      socket.join(`ride_${rideId}`);

      // ── Get driver's current location (last known) ──
      const driverProfile = await DriverRepository.findByUserId(
        socket.user._id
      ).catch(() => null);

      const driverLat = driverProfile?.currentLocation?.coordinates?.[1] ?? 0;
      const driverLng = driverProfile?.currentLocation?.coordinates?.[0] ?? 0;

      // ── Notify RIDER (in ride room) → transition to ActiveRideScreen ──
      io.to(`ride_${rideId}`).emit('ride_accepted', {
        rideId,
        driverId:     socket.user._id.toString(),
        driverName:   socket.user.name,
        driverPhone:  socket.user.phone  || '',
        driverRating: socket.user.rating || 0,
        finalFare,
        driverLat,
        driverLng,
        otp:          ride.otp || _generateOTP(),
      });

      // ── Notify DRIVER → transition to DriverActiveRideScreen ──
      socket.emit('ride_accepted_driver', {
        rideId,
        riderId:      ride.rider.toString(),
        riderName:    ride.riderName || '',
        riderPhone:   ride.riderPhone || '',
        pickup:       ride.pickup?.address  || '',
        dest:         ride.destination?.address || '',
        fare:         finalFare,
        otp:          ride.otp || '',
        riderLat:     ride.pickup?.coordinates?.coordinates?.[1] ?? 0,
        riderLng:     ride.pickup?.coordinates?.coordinates?.[0] ?? 0,
      });

      logger.info(`🎉 Ride ${rideId} accepted by driver ${socket.user._id}`);

    } catch (err) {
      logger.error(`Accept ride error: ${err.message}`);
      socket.emit('accept_ride_error', { message: 'Could not accept ride.' });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // EVENT: driver_location_update
  // Emitted by: DRIVER every 5 seconds while ride is active
  // Received by: RIDER on active ride screen
  // ─────────────────────────────────────────────────────────────
  socket.on('driver_location_update', ({ latitude, longitude, rideId }) => {
    if (socket.user.role !== 'driver') return;

    const payload = {
      driverId:  socket.user._id.toString(),
      latitude,
      longitude,
      timestamp: new Date(),
    };

    // Emit to ride room (rider receives this)
    if (rideId) {
      io.to(`ride_${rideId}`).emit('driver_location_update', payload);
    }

    // Also emit on personal channel (backwards compat)
    io.emit(`driver_location_${socket.user._id}`, payload);
  });

  // ─────────────────────────────────────────────────────────────
  // EVENT: update_ride_status
  // Emitted by: DRIVER — arrived / started / completed
  // ─────────────────────────────────────────────────────────────
  socket.on('update_ride_status', async ({ rideId, status }) => {
    if (socket.user.role !== 'driver') return;

    const allowed = ['arrived', 'started', 'completed'];
    if (!allowed.includes(status)) return;

    logger.info(`🔄 Ride ${rideId} → ${status}`);

    try {
      await RideRepository.updateStatus(rideId, status, {
        [`timeline.${status}At`]: new Date(),
      });

      // Notify everyone in the ride room (rider + driver)
      io.to(`ride_${rideId}`).emit('ride_status_updated', {
        rideId,
        status,
        timestamp: new Date(),
      });

      // On completion, emit dedicated event for rating screen
      if (status === 'completed') {
        const ride = await RideRepository.findByIdRaw(rideId);
        io.to(`ride_${rideId}`).emit('ride_completed', {
          rideId,
          finalFare: ride?.finalFare || 0,
          driverId:  socket.user._id.toString(),
          riderId:   ride?.rider?.toString() || '',
        });
      }

    } catch (err) {
      logger.error(`Status update error: ${err.message}`);
      socket.emit('status_update_error', {
        message: 'Could not update status.',
      });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // EVENT: cancel_ride
  // Emitted by: RIDER or DRIVER
  // ─────────────────────────────────────────────────────────────
  socket.on('cancel_ride', async ({ rideId, reason }) => {
    logger.info(`❌ Ride ${rideId} cancelled by ${socket.user.role}`);

    try {
      await RideRepository.updateStatus(rideId, 'cancelled', {
        cancelledBy:           socket.user.role,
        cancellationReason:    reason || 'No reason given',
        'timeline.cancelledAt': new Date(),
      });

      io.to(`ride_${rideId}`).emit('ride_cancelled', {
        rideId,
        cancelledBy: socket.user.role,
        reason:      reason || '',
      });

    } catch (err) {
      logger.error(`Cancel ride error: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // EVENT: join_ride / leave_ride (keep existing)
  // ─────────────────────────────────────────────────────────────
  socket.on('join_ride', ({ rideId }) => {
    socket.join(`ride_${rideId}`);
    socket.emit('joined_ride', { rideId });
  });

  socket.on('leave_ride', ({ rideId }) => {
    socket.leave(`ride_${rideId}`);
  });
};

// ── Helper ──
function _generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}