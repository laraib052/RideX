const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { requireAuth } = require('../middlewares/auth.middleware'); // ✅

router.use(requireAuth); // ✅

router.get('/history', (req, res, next) => PaymentController.getHistory(req, res, next));
router.get('/:paymentId', (req, res, next) => PaymentController.getPayment(req, res, next));

module.exports = router;