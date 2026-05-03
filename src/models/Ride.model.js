const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },
}, { _id: false });

const rideSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    driverProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DriverProfile',
      default: null,
    },

    pickup: { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },

    status: {
      type: String,
      enum: [
        'pending',       // Rider created, waiting for driver bids
        'bidding',       // Drivers are placing bids
        'accepted',      // Rider accepted a bid
        'driver_arrived',// Driver reached pickup
        'in_progress',   // Ride started
        'completed',     // Ride finished
        'cancelled',     // Cancelled by either party
      ],
      default: 'pending',
      index: true,
    },

    // Rider's suggested price (inDrive model)
    suggestedFare: { type: Number, required: true },
    // Final agreed fare (set when bid accepted)
    finalFare: { type: Number, default: null },

    distance: { type: Number }, // in km
    duration: { type: Number }, // estimated minutes

    // Timestamps for each status change
    timeline: {
      createdAt: Date,
      acceptedAt: Date,
      driverArrivedAt: Date,
      startedAt: Date,
      completedAt: Date,
      cancelledAt: Date,
    },

    cancelReason: String,
    cancelledBy: {
      type: String,
      enum: ['rider', 'driver', 'system'],
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'wallet'],
      default: 'cash',
    },

    // Ratings given after ride
    riderRating: { type: Number, min: 1, max: 5 },
    driverRating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

rideSchema.index({ pickup: '2dsphere' });
rideSchema.index({ rider: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);