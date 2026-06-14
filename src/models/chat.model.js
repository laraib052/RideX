// src/models/chat-message.model.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    ride: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Ride',
      required: true,
      index:    true,
    },
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    senderRole: {
      type:     String,
      enum:     ['rider', 'driver'],
      required: true,
    },
    text: {
      type:      String,
      required:  true,
      maxlength: 500,
      trim:      true,
    },
    readAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ ride: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);