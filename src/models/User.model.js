const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'],
    },
    // ✅ Password add kiya (Firebase ki jagah)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['rider', 'driver'],
      required: true,
      index: true,
    },
    profilePhoto: String,
    fcmToken: String,

    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    isBlocked:  { type: Boolean, default: false },
    isAdmin:    { type: Boolean, default: false },

    rating:     { type: Number, default: 5.0, min: 1, max: 5 },
    totalRides: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);