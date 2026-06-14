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

    // ── Vehicle details ──────────────────────────
    vehicle: {
      type: {
        type: String,
        enum: ['car', 'rickshaw', 'bike'],
        required: true,
      },
      make:  { type: String, required: true },   // e.g. "Toyota"
      model: { type: String, required: true },   // e.g. "Corolla"
      year:  { type: Number, required: true },
      color: { type: String, required: true },
      plateNumber: { type: String, required: true, unique: true },
    },

    // ── License & documents ───────────────────────
    licenseNumber: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    licensePhoto:  { type: String, required: true }, // URL/path

    cnicNumber:    { type: String, required: true },
    cnicFrontPhoto: { type: String, required: true }, // URL/path
    cnicBackPhoto:  { type: String, required: true }, // URL/path

    // ── Verification ──────────────────────────────
    isVerified: { type: Boolean, default: false }, // admin approves docs
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: null },

    // ── Availability ──────────────────────────────
    isOnline: { type: Boolean, default: false, index: true },

    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    rating:     { type: Number, default: 5.0 },
    totalRides: { type: Number, default: 0 },

    earnings: {
      total:     { type: Number, default: 0 },
      thisWeek:  { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

driverProfileSchema.index({ currentLocation: '2dsphere' });
driverProfileSchema.index({ isOnline: 1, isVerified: 1 });

module.exports = mongoose.model('DriverProfile', driverProfileSchema);