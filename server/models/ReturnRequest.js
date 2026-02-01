const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
    requestNumber: {
        type: String,
        required: true,
        unique: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    orderNumber: String,
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
        returnQuantity: Number,
        condition: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'damaged'],
            default: 'good',
        },
    }],
    reason: {
        type: String,
        enum: ['no_longer_needed', 'project_completed', 'equipment_issue', 'other'],
        required: true,
    },
    reasonDetails: String,
    preferredDate: Date,
    status: {
        type: String,
        enum: ['pending', 'approved', 'scheduled', 'completed', 'rejected'],
        default: 'pending',
    },
    scheduledDate: Date,
    completedDate: Date,
    vendorNotes: String,
    customerNotes: String,
    refundAmount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Auto-generate request number
returnRequestSchema.pre('save', async function (next) {
    if (this.isNew && !this.requestNumber) {
        const count = await mongoose.model('ReturnRequest').countDocuments();
        this.requestNumber = `RET-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

module.exports = ReturnRequest;
