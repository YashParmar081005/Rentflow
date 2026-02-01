const express = require('express');
const router = express.Router();
const { getInvoices, getInvoiceById, payInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getInvoices);
router.route('/:id').get(protect, getInvoiceById);
router.route('/:id/pay').put(protect, payInvoice);

module.exports = router;
