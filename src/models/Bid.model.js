// src/models/bid.model.js
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    ride: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Ride',
      required: true,
      index:    true,
    },
    driver: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    amount: {
      type:    Number,
      required: [true, 'Bid amount required'],
      min:     [1,    'Bid must be positive'],
    },

    status: {
      type:    String,
      enum:    ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      index:   true,
    },

    message: { type: String, maxlength: 200 },

    // Auto-deletes after 5 minutes if not accepted
    expiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
      index:   { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

// One active bid per driver per ride
bidSchema.index({ ride: 1, driver: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);