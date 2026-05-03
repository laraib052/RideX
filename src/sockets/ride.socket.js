const DriverRepository = require('../repositories/driver.repository');

module.exports = (socket, io) => {
  // Rider joins a specific ride room to get real-time updates
  socket.on('join_ride', ({ rideId }) => {
    socket.join(`ride_${rideId}`);
    socket.emit('joined_ride', { rideId });
  });

  socket.on('leave_ride', ({ rideId }) => {
    socket.leave(`ride_${rideId}`);
  });

  // Driver sends location updates (called frequently — every few seconds)
  socket.on('driver_location_update', async ({ longitude, latitude }) => {
    if (socket.user.role !== 'driver') return;

    try {
      await DriverRepository.updateLocation(
        null, // We'll update by userId instead
        longitude,
        latitude
      );

      // Broadcast to anyone tracking this driver
      io.emit(`driver_location_${socket.user._id}`, {
        driverId: socket.user._id,
        longitude,
        latitude,
        timestamp: new Date(),
      });
    } catch (err) {
      // Silently fail — location update is non-critical
    }
  });
};