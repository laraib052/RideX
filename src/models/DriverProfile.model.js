const mongoose = require('mongoose');

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Vehicle details
    vehicle: {
      make: { type: String, required: true },      // e.g. "Toyota"
      model: { type: String, required: true },     // e.g. "Corolla"
      year: { type: Number, required: true },
      color: { type: String, required: true },
      plateNumber: { type: String, required: true, unique: true },
      type: {
        type: String,
        enum: ['sedan', 'suv', 'bike', 'auto'],
        required: true,
      },
    },

    // License & documents
    licenseNumber: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    cnicNumber: { type: String, required: true },

    isApproved: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false, index: true },

    // GeoJSON Point — MongoDB native geo format
    // Enables $near, $geoWithin queries for finding nearby drivers
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — note: lng FIRST
        default: [0, 0],
      },
    },

    rating: { type: Number, default: 5.0 },
    totalRides: { type: Number, default: 0 },

    earnings: {
      total: { type: Number, default: 0 },
      thisWeek: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// 2dsphere index — REQUIRED for geo queries
driverProfileSchema.index({ currentLocation: '2dsphere' });
driverProfileSchema.index({ isOnline: 1, isApproved: 1 });

module.exports = mongoose.model('DriverProfile', driverProfileSchema);