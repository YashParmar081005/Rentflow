const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true,
    },
    invoiceNumber: String,
    amount: {
        type: Number,
        required: true,
    },
    method: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'upi'],
        required: true,
    },
    reference: String,
    notes: String,
}, {
    timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
