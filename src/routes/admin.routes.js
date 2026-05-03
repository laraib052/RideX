const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.get('/drivers/pending', AdminController.getPendingDrivers);
router.patch('/drivers/:userId/approve', AdminController.approveDriver);
router.patch('/drivers/:userId/reject', AdminController.rejectDriver);
router.patch('/users/:userId/block', AdminController.blockUser);
router.patch('/users/:userId/unblock', AdminController.unblockUser);
router.get('/rides', AdminController.getAllRides);

module.exports = router;