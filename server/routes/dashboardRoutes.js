const express = require('express');
const router = express.Router();
const { getCustomerDashboardStats, getVendorDashboardStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/customer').get(protect, getCustomerDashboardStats);
router.route('/vendor').get(protect, authorize('vendor', 'admin'), getVendorDashboardStats);

module.exports = router;
