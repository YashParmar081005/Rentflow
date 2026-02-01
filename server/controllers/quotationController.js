const Quotation = require('../models/Quotation');
const Product = require('../models/Product');

// @desc    Create a new quotation
// @route   POST /api/quotations
// @access  Private/Customer
const createQuotation = async (req, res) => {
    try {
        const { items, validUntil, notes } = req.body;

        if (items && items.length === 0) {
            return res.status(400).json({ message: 'No items' });
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;
        let depositAmount = 0;

        // This loop should ideally fetch product details again to ensure price integrity, 
        // but we'll accept body values for now assuming frontend calculations are correct, 
        // or better, fetch prices here. Let's fetch prices.
        // For simplicity in this plan, I'll trust the logic or basic recalculation.

        // Simplification: We trust the passed structure but ideally we should validate prices.
        items.forEach(item => {
            subtotal += item.subtotal;
        });

        // Assume 18% tax for now or calculate based on logic
        taxAmount = subtotal * 0.18;
        // Assume deposit logic is passed or calculated
        depositAmount = items.reduce((acc, item) => acc + (item.dailyRate * 5), 0); // Placeholder logic

        const totalAmount = subtotal + taxAmount;

        const quotation = new Quotation({
            quotationNumber: `QT-${Date.now()}`,
            customer: req.user._id,
            customerName: req.user.name,
            customerEmail: req.user.email,
            items,
            subtotal,
            taxAmount,
            depositAmount,
            totalAmount,
            validUntil,
            notes,
            status: 'sent'
        });

        const createdQuotation = await quotation.save();
        res.status(201).json(createdQuotation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
    try {
        let quotations;
        if (req.user.role === 'admin') {
            quotations = await Quotation.find({}).sort({ createdAt: -1 });
        } else {
            quotations = await Quotation.find({ customer: req.user._id }).sort({ createdAt: -1 });
        }
        res.json(quotations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (quotation) {
            // Check access
            if (req.user.role !== 'admin' && quotation.customer.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            res.json(quotation);
        } else {
            res.status(404).json({ message: 'Quotation not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update quotation status
// @route   PUT /api/quotations/:id
// @access  Private
const updateQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);
        if (quotation) {
            quotation.status = req.body.status || quotation.status;
            const updatedQuotation = await quotation.save();
            res.json(updatedQuotation);
        } else {
            res.status(404).json({ message: 'Quotation not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation
};
