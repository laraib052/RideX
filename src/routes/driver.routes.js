const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/driver.controller');
const { verifyFirebaseToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.use(verifyFirebaseToken, requireRole('driver'));

router.post('/profile', DriverController.createProfile);
router.get('/profile', DriverController.getProfile);
router.patch('/status', DriverController.toggleStatus);
router.patch('/location', DriverController.updateLocation);
router.get('/earnings', DriverController.getEarnings);
router.get('/history', DriverController.getRideHistory);
router.patch('/rides/:rideId/status', DriverController.updateRideStatus);

module.exports = router;