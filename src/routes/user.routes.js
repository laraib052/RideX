const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const Joi = require('joi');
const { validate } = require('../middlewares/validate.middleware');

const authMiddleware = require('../middlewares/auth.middleware');
const requireAuth = authMiddleware.requireAuth || authMiddleware.verifyFirebaseToken;

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  profilePhoto: Joi.string().uri().optional(),
});

router.use(requireAuth);

router.get('/profile', (req, res, next) => UserController.getProfile(req, res, next));
router.patch('/profile', validate(updateProfileSchema), (req, res, next) => UserController.updateProfile(req, res, next));
router.get('/rides/history', (req, res, next) => UserController.getRideHistory(req, res, next));
router.get('/rides/active', (req, res, next) => UserController.getActiveRide(req, res, next));
router.delete('/account', (req, res, next) => UserController.deleteAccount(req, res, next));

module.exports = router;