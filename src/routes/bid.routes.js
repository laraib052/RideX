const express = require('express');
const router = express.Router();
const BidController = require('../controllers/bid.controller');
const { verifyFirebaseToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { placeBidSchema } = require('../validators/bid.validator');

router.use(verifyFirebaseToken);

// GET /api/bids/ride/:rideId — rider sees all bids on their ride
router.get('/ride/:rideId', requireRole('rider'), BidController.getRideBids);

// POST /api/bids/ride/:rideId — driver places a bid
router.post('/ride/:rideId', requireRole('driver'), validate(placeBidSchema), BidController.placeBid);

// PATCH /api/bids/:bidId/accept — rider accepts a bid
router.patch('/:bidId/accept', requireRole('rider'), BidController.acceptBid);

module.exports = router;