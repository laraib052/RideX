const Payment = require('../models/Payment.model');
const RideRepository = require('../repositories/ride.repository');
const DriverProfile = require('../models/DriverProfile.model');

class PaymentService {
  // Called automatically when ride is completed
  async createPaymentRecord(rideId) {
    const ride = await RideRepository.findById(rideId);
    if (!ride) throw Object.assign(new Error('Ride not found'), { statusCode: 404 });

    // Avoid duplicate payment records
    const existing = await Payment.findOne({ ride: rideId });
    if (existing) return existing;

    const payment = await Payment.create({
      ride: rideId,
      rider: ride.rider._id,
      driver: ride.driver._id,
      amount: ride.finalFare,
      method: ride.paymentMethod,
      status: ride.paymentMethod === 'cash' ? 'completed' : 'pending',
    });

    // Update driver earnings
    if (payment.status === 'completed') {
      await this._updateDriverEarnings(ride.driver._id, ride.finalFare);
    }

    return payment;
  }

  async _updateDriverEarnings(driverId, amount) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Use $inc to atomically add earnings
    await DriverProfile.findOneAndUpdate(
      { user: driverId },
      {
        $inc: {
          'earnings.total': amount,
          'earnings.thisWeek': amount,
          'earnings.thisMonth': amount,
        },
        $inc: { totalRides: 1 },
      }
    );
  }

  async getPaymentHistory(userId, role, page = 1, limit = 10) {
    const filter = role === 'rider' ? { rider: userId } : { driver: userId };
    return Payment.find(filter)
      .populate('ride', 'pickup destination')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async getPaymentById(paymentId) {
    return Payment.findById(paymentId)
      .populate('ride')
      .populate('rider', 'name phone')
      .populate('driver', 'name phone');
  }
}

module.exports = new PaymentService();