const DriverRepository = require('../repositories/driver.repository');
const logger = require('../utils/logger');

module.exports = (socket, io) => {

  // Rider joins ride room to receive real-time updates
  socket.on('join_ride', ({ rideId }) => {
    socket.join(`ride_${rideId}`);
    socket.emit('joined_ride', { rideId });
    logger.info(`User ${socket.user.name} joined ride_${rideId}`);
  });

  socket.on('leave_ride', ({ rideId }) => {
    socket.leave(`ride_${rideId}`);
  });

  // Driver sends location update every few seconds
  socket.on('driver_location_update', async ({ latitude, longitude, heading = 0 }) => {
    if (socket.user.role !== 'driver') return;

    try {
      // Save to DB
      await DriverRepository.updateLocation(socket.user._id, longitude, latitude);

      // Broadcast to rider tracking this driver
      io.emit(`driver_location_${socket.user._id}`, {
        driverId:  socket.user._id,
        latitude,
        longitude,
        heading,
        timestamp: new Date(),
      });
    } catch (err) {
      // Non-critical — silent fail
    }
  });

  // Driver updates ride status (picked_up, started, completed)
  socket.on('update_ride_status', ({ rideId, status }) => {
    if (socket.user.role !== 'driver') return;

    // Notify rider in that ride room
    io.to(`ride_${rideId}`).emit('ride_status_updated', {
      rideId,
      status,
      timestamp: new Date(),
    });

    // If completed → emit ride_completed
    if (status === 'completed') {
      io.to(`ride_${rideId}`).emit('ride_completed', {
        rideId,
        timestamp: new Date(),
      });
      logger.info(`Ride ${rideId} completed by driver ${socket.user.name}`);
    }
  });

  // Rider cancels ride
  socket.on('cancel_ride', ({ rideId, reason }) => {
    io.to(`ride_${rideId}`).emit('ride_cancelled', {
      rideId,
      reason: reason || 'Rider cancelled',
      cancelledBy: socket.user.role,
      timestamp: new Date(),
    });
    logger.info(`Ride ${rideId} cancelled by ${socket.user.name}`);
  });
};