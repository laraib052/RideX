const PaymentService = require('../services/payment.service');
const { success } = require('../utils/response.util');

class PaymentController {
  async getHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const payments = await PaymentService.getPaymentHistory(
        req.user._id, req.user.role, Number(page), Number(limit)
      );
      return success(res, payments);
    } catch (err) { next(err); }
  }

  async getPayment(req, res, next) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.paymentId);
      if (!payment) return error(res, 'Payment not found', 404);
      return success(res, payment);
    } catch (err) { next(err); }
  }
}

module.exports = new PaymentController();