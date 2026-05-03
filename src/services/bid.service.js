const BidRepository = require('../repositories/bid.repository');
const RideRepository = require('../repositories/ride.repository');
const DriverRepository = require('../repositories/driver.repository');
const UserRepository = require('../repositories/user.repository');
const NotificationService = require('./notification.service');
const { getIO } = require('../sockets/socket.manager');

class BidService {
  async placeBid(driverId, { rideId, amount, message }) {
    const ride = await RideRepository.findByIdRaw(rideId);
    if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });

    if (!['pending', 'bidding'].includes(ride.status)) {
      throw Object.assign(new Error('This ride is no longer accepting bids'), { statusCode: 400 });
    }

    // Check driver hasn't already bid
    const existing = await BidRepository.findExistingBid(rideId, driverId);
    if (existing) {
      throw Object.assign(new Error('You already placed a bid on this ride'), { statusCode: 409 });
    }

    const driverProfile = await DriverRepository.findByUserId(driverId);
    if (!driverProfile || !driverProfile.isApproved) {
      throw Object.assign(new Error('Driver profile not approved'), { statusCode: 403 });
    }

    const bid = await BidRepository.create({
      ride: rideId,
      driver: driverId,
      driverProfile: driverProfile._id,
      amount,
      message,
    });

    // Update ride status to bidding
    if (ride.status === 'pending') {
      await RideRepository.updateStatus(rideId, 'bidding');
    }

    // Populate bid for response
    const populatedBid = await BidRepository.findById(bid._id);

    // Real-time: Notify rider of new bid via socket
    const io = getIO();
    io.to(`ride_${rideId}`).emit('new_bid', {
      bid: {
        id: bid._id,
        amount,
        message,
        driverName: populatedBid.driver.name,
        driverRating: populatedBid.driver.rating,
      },
    });

    // Push notification to rider
    const rider = await UserRepository.findById(ride.rider);
    if (rider?.fcmToken) {
      await NotificationService.notifyRiderBidReceived(
        rider.fcmToken,
        populatedBid.driver.name,
        amount
      );
    }

    return populatedBid;
  }

  async acceptBid(riderId, bidId) {
    const bid = await BidRepository.findById(bidId);
    if (!bid) throw Object.assign(new Error('Bid not found'), { statusCode: 404 });

    const ride = await RideRepository.findByIdRaw(bid.ride);
    if (ride.rider.toString() !== riderId.toString()) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    if (ride.status !== 'bidding') {
      throw Object.assign(new Error('Cannot accept bid at this stage'), { statusCode: 400 });
    }

    // Accept this bid, reject all others
    await BidRepository.updateStatus(bidId, 'accepted');
    await BidRepository.rejectOtherBids(bid.ride, bidId);

    // Update ride with driver info
    await RideRepository.updateStatus(bid.ride, 'accepted', {
      driver: bid.driver._id,
      driverProfile: bid.driverProfile._id,
      finalFare: bid.amount,
    });

    // Notify driver via socket
    const io = getIO();
    io.to(`driver_${bid.driver._id}`).emit('bid_accepted', {
      rideId: bid.ride,
      message: 'Your bid was accepted! Head to pickup now.',
    });

    // Push notification
    await NotificationService.notifyDriverBidAccepted(
      bid.driver.fcmToken,
      String(bid.ride)
    );

    return await RideRepository.findById(bid.ride);
  }

  async getRideBids(rideId, riderId) {
    const ride = await RideRepository.findByIdRaw(rideId);
    if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });
    if (ride.rider.toString() !== riderId.toString()) {
      throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    return BidRepository.findByRideId(rideId);
  }
}

module.exports = new BidService();