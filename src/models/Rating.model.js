const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    givenTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 300 },
    raterRole: { type: String, enum: ['rider', 'driver'], required: true },
  },
  { timestamps: true }
);

// One rating per person per ride
ratingSchema.index({ ride: 1, givenBy: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);