const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    orderNumber: { // Denormalized for easier display
        type: String,
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerName: {
        type: String,
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    items: [{
        productName: String,
        quantity: Number,
        rentalDays: Number,
        dailyRate: Number,
        amount: Number
    }],
    subtotal: {
        type: Number,
        required: true,
    },
    taxAmount: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    balanceAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled'],
        default: 'pending',
    },
    issueDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    vendorName: {
        type: String,
        default: 'Multiple Vendors' // Placeholder for now
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
