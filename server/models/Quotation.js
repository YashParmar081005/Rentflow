const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        required: true,
        unique: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerName: String,
    customerEmail: String,
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productName: String,
        quantity: Number,
        startDate: Date,
        endDate: Date,
        rentalDays: Number,
        dailyRate: Number,
        subtotal: Number,
    }],
    subtotal: Number,
    taxAmount: Number,
    depositAmount: Number,
    totalAmount: Number,
    status: {
        type: String,
        enum: ['draft', 'sent', 'confirmed', 'expired', 'cancelled'],
        default: 'draft',
    },
    validUntil: Date,
    notes: String,
}, {
    timestamps: true,
});

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
