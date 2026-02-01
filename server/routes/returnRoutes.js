const express = require('express');
const router = express.Router();
const {
    getReturns,
    processReturn,
    calculateLateFee,
    createReturnRequest,
    getMyReturnRequests,
    getVendorReturnRequests,
    updateReturnRequestStatus,
    getReturnRequest,
    getEligibleOrders,
} = require('../controllers/returnController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ===== Customer Return Request Routes =====
// Get orders eligible for return
router.get('/eligible-orders', protect, getEligibleOrders);

// Get customer's return requests
router.get('/my-requests', protect, getMyReturnRequests);

// Create a return request
router.post('/request', protect, createReturnRequest);

// Get single return request
router.get('/request/:id', protect, getReturnRequest);

// ===== Vendor Return Request Routes =====
// Get vendor's return requests
router.get('/requests', protect, authorize('vendor', 'admin'), getVendorReturnRequests);

// Update return request status
router.put('/request/:id/status', protect, authorize('vendor', 'admin'), updateReturnRequestStatus);

// ===== Existing Vendor Return Processing =====
// Get all returns for vendor (orders ready for return)
router.get('/', protect, authorize('vendor', 'admin'), getReturns);

// Process a return (mark as completed)
router.put('/:id/process', protect, authorize('vendor', 'admin'), processReturn);

// Calculate late fee for an order
router.get('/:id/late-fee', protect, authorize('vendor', 'admin'), calculateLateFee);

module.exports = router;

