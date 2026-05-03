const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);
router.get('/history', PaymentController.getHistory);
router.get('/:paymentId', PaymentController.getPayment);

module.exports = router;