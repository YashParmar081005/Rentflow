const express = require('express');
const router = express.Router();
const {
    getEarnings,
    getPayouts
} = require('../controllers/earningsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get earnings data
router.get('/', protect, authorize('vendor', 'admin'), getEarnings);

// Get payout history
router.get('/payouts', protect, authorize('vendor', 'admin'), getPayouts);

module.exports = router;
