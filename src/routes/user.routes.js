const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const Joi = require('joi');
const { validate } = require('../middlewares/validate.middleware');

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  profilePhoto: Joi.string().uri().optional(),
});

router.use(requireAuth);

// GET  /api/user/profile
router.get('/profile', UserController.getProfile);

// PATCH /api/user/profile
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);

// GET  /api/user/rides/history
router.get('/rides/history', UserController.getRideHistory);

// GET  /api/user/rides/active
router.get('/rides/active', UserController.getActiveRide);

// DELETE /api/user/account
router.delete('/account', UserController.deleteAccount);

module.exports = router;