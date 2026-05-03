const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const requireAuth = authMiddleware.requireAuth || authMiddleware.verifyFirebaseToken;

router.use(requireAuth);

router.get('/history', (req, res, next) => PaymentController.getHistory(req, res, next));
router.get('/:paymentId', (req, res, next) => PaymentController.getPayment(req, res, next));

module.exports = router;