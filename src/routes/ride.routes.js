const express = require('express');
const router = express.Router();
const RideController = require('../controllers/ride.controller');
const { requireAuth } = require('../middlewares/auth.middleware'); // ✅ Fix
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createRideSchema, cancelRideSchema } = require('../validators/ride.validator');

// All routes require auth
router.use(requireAuth); // ✅ Fix

router.post('/', requireRole('rider'), validate(createRideSchema), RideController.createRide);
router.get('/active', RideController.getActiveRide);
router.get('/history', RideController.getRideHistory);
router.get('/:rideId', RideController.getRide);
router.patch('/:rideId/cancel', validate(cancelRideSchema), RideController.cancelRide);
router.patch('/:rideId/complete', requireRole('driver'), RideController.completeRide);

module.exports = router;