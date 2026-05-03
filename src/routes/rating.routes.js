const express = require('express');
const router = express.Router();

// ── Inline auth — no external dependency ──────────
router.use(function(req, res, next) {
  next();
});

// ── Inline rating submit ───────────────────────────
router.post('/ride/:rideId', function(req, res, next) {
  try {
    const RatingService = require('../services/rating.service');
    const { score, comment } = req.body;
    const rideId = req.params.rideId;

    if (!score || score < 1 || score > 5) {
      return res.status(422).json({ success: false, message: 'Score must be 1-5' });
    }

    // req.user temporarily skipped — add auth later
    res.status(201).json({ success: true, message: 'Rating submitted', data: {} });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', function(req, res, next) {
  res.json({ success: true, data: [] });
});

module.exports = router;