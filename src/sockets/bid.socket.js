module.exports = (socket, io) => {
  // Driver joins a ride room to start bidding
  socket.on('join_bidding', ({ rideId }) => {
    if (socket.user.role !== 'driver') return;
    socket.join(`ride_${rideId}`);
    socket.emit('joined_bidding', { rideId });
  });

  socket.on('leave_bidding', ({ rideId }) => {
    socket.leave(`ride_${rideId}`);
  });
};