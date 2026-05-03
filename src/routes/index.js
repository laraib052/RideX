const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/rides', require('./ride.routes'));
router.use('/bids', require('./bid.routes'));
router.use('/driver', require('./driver.routes'));
router.use('/ratings',  require('./rating.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/admin',    require('./admin.routes'));
router.use('/user',     require('./user.routes')); 
// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;