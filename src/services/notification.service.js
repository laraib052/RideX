const logger = require('../utils/logger');

class NotificationService {
  async sendToDevice(fcmToken, title, body, data = {}) {
    // TODO: Firebase ki jagah baad mein koi aur service lagana
    logger.info(`[Notification Skipped] ${title}: ${body}`);
  }

  async sendToMultiple(fcmTokens, title, body, data = {}) {
    logger.info(`[Notification Skipped] ${title}: ${body}`);
  }

  async notifyDriverNewRide(fcmToken, rideId, pickupAddress) {
    await this.sendToDevice(fcmToken, 'New Ride Request', `Pickup: ${pickupAddress}`, { type: 'NEW_RIDE', rideId });
  }

  async notifyRiderBidReceived(fcmToken, driverName, bidAmount) {
    await this.sendToDevice(fcmToken, 'New Bid Received', `${driverName} offered PKR ${bidAmount}`, { type: 'NEW_BID' });
  }

  async notifyDriverBidAccepted(fcmToken, rideId) {
    await this.sendToDevice(fcmToken, 'Bid Accepted', 'Head to pickup location.', { type: 'BID_ACCEPTED', rideId });
  }

  async notifyRiderDriverArrived(fcmToken) {
    await this.sendToDevice(fcmToken, 'Driver Arrived', 'Your driver is at pickup location.', { type: 'DRIVER_ARRIVED' });
  }

  async notifyRideCompleted(fcmToken, amount) {
    await this.sendToDevice(fcmToken, 'Ride Completed', `Total fare: PKR ${amount}`, { type: 'RIDE_COMPLETED' });
  }
}

module.exports = new NotificationService();