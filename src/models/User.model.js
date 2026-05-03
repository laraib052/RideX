const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Firebase UID — this links Firebase Auth to our DB record
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'],
    },
    email: {
      type: String,
      sparse: true, // allows null but must be unique when set
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['rider', 'driver'],
      required: true,
      index: true,
    },
    profilePhoto: String,

    // FCM token for push notifications (updated on each app open)
    fcmToken: String,

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },

    // Rider-specific
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    totalRides: { type: Number, default: 0 },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
);

module.exports = mongoose.model('User', userSchema);