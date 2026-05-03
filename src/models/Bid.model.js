const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DriverProfile',
      required: true,
    },

    amount: {
      type: Number,
      required: [true, 'Bid amount required'],
      min: [1, 'Bid must be positive'],
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },

    message: { type: String, maxlength: 200 }, // Optional note from driver

    // Expires after 5 min if not accepted
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
      index: { expireAfterSeconds: 0 }, // MongoDB TTL auto-deletes
    },
  },
  { timestamps: true }
);

// One driver can only have one active bid per ride
bidSchema.index({ ride: 1, driver: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);