const Bid = require('../models/Bid.model');

class BidRepository {
  async create(data) {
    return Bid.create(data);
  }

  async findById(id) {
    return Bid.findById(id)
      .populate('driver', 'name phone rating profilePhoto')
      .populate('driverProfile');
  }

  async findByRideId(rideId) {
    return Bid.find({ ride: rideId, status: 'pending' })
      .populate('driver', 'name phone rating profilePhoto')
      .populate('driverProfile')
      .sort({ amount: 1 }); // Lowest bid first
  }

  async findExistingBid(rideId, driverId) {
    return Bid.findOne({ ride: rideId, driver: driverId });
  }

  async updateStatus(bidId, status) {
    return Bid.findByIdAndUpdate(bidId, { status }, { new: true });
  }

  // When a bid is accepted, reject all others on same ride
  async rejectOtherBids(rideId, acceptedBidId) {
    return Bid.updateMany(
      { ride: rideId, _id: { $ne: acceptedBidId }, status: 'pending' },
      { status: 'rejected' }
    );
  }
}

module.exports = new BidRepository();