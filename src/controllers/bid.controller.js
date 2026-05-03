const BidService = require('../services/bid.service');
const { success, created } = require('../utils/response.util');

class BidController {
  async placeBid(req, res, next) {
    try {
      const bid = await BidService.placeBid(req.user._id, {
        rideId: req.params.rideId,
        ...req.body,
      });
      return created(res, bid, 'Bid placed successfully');
    } catch (err) {
      next(err);
    }
  }

  async acceptBid(req, res, next) {
    try {
      const ride = await BidService.acceptBid(req.user._id, req.params.bidId);
      return success(res, ride, 'Bid accepted! Driver is on the way.');
    } catch (err) {
      next(err);
    }
  }

  async getRideBids(req, res, next) {
    try {
      const bids = await BidService.getRideBids(req.params.rideId, req.user._id);
      return success(res, bids);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BidController();