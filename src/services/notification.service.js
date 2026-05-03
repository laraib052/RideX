const admin = require('../config/firebase');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Send push notification to a single device
   * @param {string} fcmToken - Device FCM token
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} data - Extra data payload (sent to Flutter)
   */
  async sendToDevice(fcmToken, title, body, data = {}) {
    if (!fcmToken) {
      logger.warn('No FCM token — skipping notification');
      return;
    }

    try {
      // Convert all data values to strings (FCM requirement)
      const stringData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      );

      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: stringData,
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'ridex_channel' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });

      logger.info(`✅ Notification sent: ${title}`);
    } catch (err) {
      // Don't crash the app if notification fails
      logger.error(`FCM send failed: ${err.message}`);
    }
  }

  /**
   * Send to multiple devices (e.g., notify all nearby drivers)
   */
  async sendToMultiple(fcmTokens, title, body, data = {}) {
    const validTokens = fcmTokens.filter(Boolean);
    if (!validTokens.length) return;

    const promises = validTokens.map((token) =>
      this.sendToDevice(token, title, body, data)
    );
    await Promise.allSettled(promises); // Don't fail if one fails
  }

  // ---- Specific notification methods ----

  async notifyDriverNewRide(fcmToken, rideId, pickupAddress) {
    await this.sendToDevice(
      fcmToken,
      '🚗 New Ride Request!',
      `Pickup: ${pickupAddress}`,
      { type: 'NEW_RIDE', rideId }
    );
  }

  async notifyRiderBidReceived(fcmToken, driverName, bidAmount) {
    await this.sendToDevice(
      fcmToken,
      '💰 New Bid Received',
      `${driverName} offered PKR ${bidAmount}`,
      { type: 'NEW_BID' }
    );
  }

  async notifyDriverBidAccepted(fcmToken, rideId) {
    await this.sendToDevice(
      fcmToken,
      '✅ Your Bid Was Accepted!',
      'Head to the pickup location now.',
      { type: 'BID_ACCEPTED', rideId }
    );
  }

  async notifyRiderDriverArrived(fcmToken) {
    await this.sendToDevice(
      fcmToken,
      '📍 Driver Arrived',
      'Your driver is at the pickup location.',
      { type: 'DRIVER_ARRIVED' }
    );
  }

  async notifyRideCompleted(fcmToken, amount) {
    await this.sendToDevice(
      fcmToken,
      '🎉 Ride Completed',
      `Total fare: PKR ${amount}`,
      { type: 'RIDE_COMPLETED' }
    );
  }
}

module.exports = new NotificationService();