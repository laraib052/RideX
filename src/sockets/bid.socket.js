// src/sockets/bid.socket.js
// Handles: join_bidding → place_bid → accept_bid → bid_closed

const logger = require('../utils/logger');

module.exports = (socket, io) => {

  // ─────────────────────────────────────────────────────────────
  // EVENT: join_bidding
  // Driver joins ride room to participate in bidding
  // ─────────────────────────────────────────────────────────────
  socket.on('join_bidding', ({ rideId }) => {
    if (socket.user.role !== 'driver') return;
    socket.join(`ride_${rideId}`);
    socket.emit('joined_bidding', { rideId });
    logger.info(`Driver ${socket.user.name} joined bidding: ride_${rideId}`);
  });

  socket.on('leave_bidding', ({ rideId }) => {
    socket.leave(`ride_${rideId}`);
  });

  // ─────────────────────────────────────────────────────────────
  // EVENT: place_bid
  // Driver sends bid amount → rider sees it in FareNegotiationScreen
  // ─────────────────────────────────────────────────────────────
  socket.on('place_bid', ({ rideId, amount, message }) => {
    if (socket.user.role !== 'driver') return;

    logger.info(`💰 Driver ${socket.user.name} bid Rs.${amount} on ride ${rideId}`);

    io.to(`ride_${rideId}`).emit('new_bid', {
      rideId,
      bidId:        null,   // REST call returns actual DB bidId
      driverId:     socket.user._id.toString(),
      driverName:   socket.user.name,
      driverPhone:  socket.user.phone  || '',
      driverRating: socket.user.rating || 0,
      amount,
      message:      message || '',
      timestamp:    new Date(),
    });
  });

  // ─────────────────────────────────────────────────────────────
  // EVENT: accept_bid
  // Rider accepts a specific driver's bid
  // Flow: notify winning driver → close bidding for others
  // ─────────────────────────────────────────────────────────────
  socket.on('accept_bid', ({ rideId, driverId, bidId, fare }) => {
    if (socket.user.role !== 'rider') return;

    logger.info(`✅ Rider ${socket.user.name} accepted bid from driver ${driverId}`);

    // ── Notify WINNING driver → go to DriverActiveRideScreen ──
    io.to(`driver_${driverId}`).emit('bid_accepted', {
      rideId,
      bidId,
      riderId:    socket.user._id.toString(),
      riderName:  socket.user.name,
      riderPhone: socket.user.phone || '',
      fare:       fare || 0,
      otp:        Math.floor(1000 + Math.random() * 9000).toString(),
      timestamp:  new Date(),
    });

    // ── Notify ALL other drivers in room — bidding closed ──
    socket.to(`ride_${rideId}`).emit('bid_closed', {
      rideId,
      message: 'Rider selected another driver.',
    });
  });
};