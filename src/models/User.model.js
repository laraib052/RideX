// src/models/user.model.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: 100,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    phone: {
      type:     String,
      required: [true, 'Phone is required'],
      unique:   true,
      match:    [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type:     String,
      enum:     ['rider', 'driver'],
      required: true,
      index:    true,
    },

    profilePhoto: String,
    fcmToken:     String,

    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true  },
    isBlocked:  { type: Boolean, default: false },
    isAdmin:    { type: Boolean, default: false },

    rating:     { type: Number, default: 5.0, min: 1, max: 5 },
    totalRides: { type: Number, default: 0 },

    // ─── DRIVER-ONLY FIELDS ───────────────────────
    // Only populated when role === 'driver'

    vehicle: {
      type:  { type: String, enum: ['car', 'rickshaw', 'bike'] },
      model: { type: String, trim: true },    // e.g. "Suzuki Mehran 2018"
      color: { type: String, trim: true },    // e.g. "White"
      plate: { type: String, trim: true },    // e.g. "LHR-1234"
    },

    documents: {
      // Driver's License
      licensePhoto: { type: String, default: null }, // Cloudinary/S3 URL

      // CNIC
      cnicFront:    { type: String, default: null },
      cnicBack:     { type: String, default: null },
    },

    // Admin reviews documents and flips this to true
    documentsVerified: { type: Boolean, default: false },

    // Driver online/offline toggle
    isOnline: { type: Boolean, default: false, index: true },

    // Last known GPS location (for nearby driver queries)
    currentLocation: {
      type: {
        type:        String,
        enum:        ['Point'],
        default:     'Point',
      },
      coordinates: {
        type:    [Number],   // [lng, lat]
        default: [0, 0],
      },
    },
  },
  { timestamps: true }
);

// 2dsphere index for geo queries (findNearbyDrivers)
userSchema.index({ currentLocation: '2dsphere' });
userSchema.index({ role: 1, isOnline: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);