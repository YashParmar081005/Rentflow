const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
    },
    quotation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation',
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerName: String,
    customerEmail: String,
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    vendorName: String,
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
        pickedUpQuantity: {
            type: Number,
            default: 0,
        },
        returnedQuantity: {
            type: Number,
            default: 0,
        },
    }],
    subtotal: Number,
    taxAmount: Number,
    depositAmount: Number,
    totalAmount: Number,
    paidAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'picked_up', 'active', 'returned', 'completed', 'cancelled'],
        default: 'pending',
    },
    pickupDate: Date,
    returnDate: Date,
    actualReturnDate: Date,
    lateFee: {
        type: Number,
        default: 0,
    },
    notes: String,
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
