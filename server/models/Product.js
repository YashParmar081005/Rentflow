const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    category: String,
    images: [String],
    dailyRate: Number,
    weeklyRate: Number,
    monthlyRate: Number,
    deposit: Number,
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    available: {
        type: Number,
        required: true,
        default: 0,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vendorName: String,
    attributes: {
        type: Map,
        of: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
