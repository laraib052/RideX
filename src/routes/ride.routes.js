const express = require('express');
const router = express.Router();
const RideController = require('../controllers/ride.controller');
const { verifyFirebaseToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createRideSchema, cancelRideSchema } = require('../validators/ride.validator');

// All routes require auth
router.use(verifyFirebaseToken);

// POST /api/rides — create new ride (riders only)
router.post('/', requireRole('rider'), validate(createRideSchema), RideController.createRide);

// GET /api/rides/active — get current active ride
router.get('/active', RideController.getActiveRide);

// GET /api/rides/history
router.get('/history', RideController.getRideHistory);

// GET /api/rides/:rideId
router.get('/:rideId', RideController.getRide);

// PATCH /api/rides/:rideId/cancel
router.patch('/:rideId/cancel', validate(cancelRideSchema), RideController.cancelRide);

// PATCH /api/rides/:rideId/complete (drivers only)
router.patch('/:rideId/complete', requireRole('driver'), RideController.completeRide);

module.exports = router;