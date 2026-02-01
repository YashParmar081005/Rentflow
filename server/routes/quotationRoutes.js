const express = require('express');
const router = express.Router();
const {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
} = require('../controllers/quotationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createQuotation)
    .get(protect, getQuotations);

router.route('/:id')
    .get(protect, getQuotationById)
    .put(protect, updateQuotation);

module.exports = router;
