const express = require('express');
const router = express.Router();
const {
    getPickups,
    processPickup,
    schedulePickup,
    cancelPickup
} = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get all pickups for vendor
router.get('/', protect, authorize('vendor', 'admin'), getPickups);

// Process a pickup (mark as picked up)
router.put('/:id/process', protect, authorize('vendor', 'admin'), processPickup);

// Schedule pickup date/time
router.put('/:id/schedule', protect, authorize('vendor', 'admin'), schedulePickup);

// Cancel/Delete a pickup
router.delete('/:id', protect, authorize('vendor', 'admin'), cancelPickup);

module.exports = router;
