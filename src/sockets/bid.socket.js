const logger = require('../utils/logger');

module.exports = (socket, io) => {

  // Driver joins ride room to start bidding
  socket.on('join_bidding', ({ rideId }) => {
    if (socket.user.role !== 'driver') return;
    socket.join(`ride_${rideId}`);
    socket.emit('joined_bidding', { rideId });
    logger.info(`Driver ${socket.user.name} joined bidding for ride_${rideId}`);
  });

  socket.on('leave_bidding', ({ rideId }) => {
    socket.leave(`ride_${rideId}`);
  });

  // Driver places a bid → notify rider in that ride room
  socket.on('place_bid', ({ rideId, amount, message }) => {
    if (socket.user.role !== 'driver') return;

    io.to(`ride_${rideId}`).emit('new_bid', {
      rideId,
      bidId:    null, // DB bidId comes from REST response
      driverId: socket.user._id,
      driverName:   socket.user.name,
      driverRating: socket.user.rating || 0,
      amount,
      message:  message || '',
      timestamp: new Date(),
    });

    logger.info(`Driver ${socket.user.name} bid ${amount} on ride ${rideId}`);
  });

  // Rider accepts a bid → notify that specific driver
  socket.on('accept_bid', ({ rideId, driverId, bidId }) => {
    if (socket.user.role !== 'rider') return;

    // Notify the winning driver directly via their personal room
    io.to(`driver_${driverId}`).emit('bid_accepted', {
      rideId,
      bidId,
      riderId:   socket.user._id,
      riderName: socket.user.name,
      riderPhone: socket.user.phone,
      timestamp: new Date(),
    });

    // Notify all other drivers in the room that bidding is closed
    socket.to(`ride_${rideId}`).emit('bid_closed', {
      rideId,
      message: 'Rider selected another driver',
    });

    logger.info(`Rider ${socket.user.name} accepted bid ${bidId} from driver ${driverId}`);
  });

  // New ride created → notify all online drivers (broadcast)
  socket.on('broadcast_ride_request', ({ rideId, vehicleType, pickup, fareOffered }) => {
    if (socket.user.role !== 'rider') return;

    // Emit to all connected drivers
    io.emit('new_ride_request', {
      rideId,
      vehicleType,
      pickup,
      fareOffered,
      riderId:   socket.user._id,
      riderName: socket.user.name,
      timestamp: new Date(),
    });

    logger.info(`New ride request ${rideId} broadcast for ${vehicleType}`);
  });
};