const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const {
            quotationId,
            items,
            subtotal,
            taxAmount,
            depositAmount,
            totalAmount,
            pickupDate,
            returnDate,
        } = req.body;

        if (items && items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        } else {
            // Get vendor info from the first product
            let vendorId = null;
            let vendorName = null;

            if (items && items.length > 0 && items[0].productId) {
                const firstProduct = await Product.findById(items[0].productId).populate('vendor', 'name');
                if (firstProduct && firstProduct.vendor) {
                    vendorId = firstProduct.vendor._id;
                    vendorName = firstProduct.vendor.name || firstProduct.vendorName;
                }
            }

            const order = new Order({
                orderNumber: `RO-${Date.now()}`,
                quotation: quotationId,
                customer: req.user._id,
                customerName: req.user.name,
                customerEmail: req.user.email,
                vendor: vendorId,
                vendorName: vendorName,
                items,
                subtotal,
                taxAmount,
                depositAmount,
                totalAmount,
                pickupDate,
                returnDate,
                status: 'pending'
            });

            const createdOrder = await order.save();

            // Create Invoice automatically
            const { createInvoice } = require('./invoiceController');
            await createInvoice(createdOrder);

            res.status(201).json(createdOrder);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        let orders;
        if (req.user.role === 'admin') {
            orders = await Order.find({})
                .populate('customer', 'name email')
                .populate('items.productId')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'vendor') {
            orders = await Order.find({ vendor: req.user._id })
                .populate('items.productId')
                .sort({ createdAt: -1 });
        } else {
            orders = await Order.find({ customer: req.user._id })
                .populate('items.productId')
                .sort({ createdAt: -1 });
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email')
            .populate('items.productId');

        if (order) {
            // Access check left as exercise or simple check
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Vendor/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = req.body.status || order.status;
            if (req.body.actualReturnDate) {
                order.actualReturnDate = req.body.actualReturnDate;
            }

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
};
