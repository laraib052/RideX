// src/models/ride.model.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address:     { type: String, required: true },
  coordinates: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },
}, { _id: false });

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    driver: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    pickup:      { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },

    status: {
      type: String,
      enum: [
        'searching',      // Rider broadcast, waiting for bids
        'pending',        // Created, not yet broadcast
        'bidding',        // Drivers placing bids
        'accepted',       // Rider accepted a bid
        'arrived',        // Driver reached pickup
        'started',        // Ride in progress
        'completed',      // Ride finished
        'cancelled',      // Cancelled
      ],
      default: 'searching',
      index:   true,
    },

    vehicleType: {
      type:    String,
      enum:    ['taxi', 'bike', 'rickshaw'],
      default: 'taxi',
    },

    suggestedFare: { type: Number, required: true },
    finalFare:     { type: Number, default: null  },

    distance: Number, // km
    duration: Number, // estimated minutes

    // ── OTP for ride start verification ──
    otp: {
      type:    String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },

    timeline: {
      createdAt:   Date,
      acceptedAt:  Date,
      arrivedAt:   Date,
      startedAt:   Date,
      completedAt: Date,
      cancelledAt: Date,
    },

    cancelReason: String,
    cancelledBy:  { type: String, enum: ['rider', 'driver', 'system'] },

    paymentStatus: {
      type:    String,
      enum:    ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type:    String,
      enum:    ['cash', 'wallet'],
      default: 'cash',
    },

    riderRating:  { type: Number, min: 1, max: 5 },
    driverRating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

rideSchema.index({ 'pickup.coordinates': '2dsphere' });
rideSchema.index({ rider: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);