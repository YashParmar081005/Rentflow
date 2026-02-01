const Order = require('../models/Order');
const ReturnRequest = require('../models/ReturnRequest');
const Product = require('../models/Product');

// @desc    Get returns for vendor (orders that are picked up/active - ready for return)
// @route   GET /api/returns
// @access  Private/Vendor
const getReturns = async (req, res) => {
    try {
        let query = {};

        // For vendors, only show their orders
        if (req.user.role === 'vendor') {
            query.vendor = req.user._id;
        }

        // Returns are orders that are picked_up/active (eligible for return) or recently completed
        query.status = { $in: ['picked_up', 'active', 'returned', 'completed'] };

        const returns = await Order.find(query)
            .populate('customer', 'name email phone')
            .populate('items.productId', 'name images')
            .sort({ returnDate: 1 });

        // Add overdue flag for orders past return date
        const ordersWithOverdueFlag = returns.map(order => {
            const orderObj = order.toObject();
            const returnDate = new Date(order.returnDate);
            const today = new Date();
            orderObj.isOverdue = returnDate < today && !['returned', 'completed'].includes(order.status);
            return orderObj;
        });

        res.json(ordersWithOverdueFlag);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process return (mark order as returned/completed)
// @route   PUT /api/returns/:id/process
// @access  Private/Vendor
const processReturn = async (req, res) => {
    try {
        const { damageNotes, lateFee, damageCharges } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if vendor owns this order
        if (req.user.role === 'vendor' && order.vendor?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update status to completed
        order.status = 'completed';
        order.actualReturnDate = new Date();

        // Update returnedQuantity for each item and restore product availability
        if (req.body.items) {
            for (const item of req.body.items) {
                const orderItem = order.items.find(
                    i => i.productId.toString() === item.productId
                );
                if (orderItem) {
                    const previousReturned = orderItem.returnedQuantity || 0;
                    orderItem.returnedQuantity = item.returnedQuantity;
                    if (item.damageNotes) {
                        orderItem.notes = item.damageNotes;
                    }

                    // Restore product availability for newly returned items
                    const newlyReturned = item.returnedQuantity - previousReturned;
                    if (newlyReturned > 0) {
                        await Product.findByIdAndUpdate(item.productId, {
                            $inc: { available: newlyReturned }
                        });
                    }
                }
            }
        } else {
            // Default: mark all items as returned and restore availability
            for (const item of order.items) {
                const previousReturned = item.returnedQuantity || 0;
                const newlyReturned = item.quantity - previousReturned;
                item.returnedQuantity = item.quantity;

                if (newlyReturned > 0) {
                    await Product.findByIdAndUpdate(item.productId, {
                        $inc: { available: newlyReturned }
                    });
                }
            }
        }

        // Add late fee if applicable
        if (lateFee && lateFee > 0) {
            order.lateFee = lateFee;
        }

        // Add damage charges if applicable
        if (damageCharges && damageCharges > 0) {
            order.damageCharges = damageCharges;
        }

        // Add notes
        if (damageNotes) {
            order.notes = (order.notes ? order.notes + '\n' : '') + `Return Notes: ${damageNotes}`;
        }

        const updatedOrder = await order.save();

        res.json({
            message: 'Return processed successfully',
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Calculate late fee for an order
// @route   GET /api/returns/:id/late-fee
// @access  Private/Vendor
const calculateLateFee = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const returnDate = new Date(order.returnDate);
        const today = new Date();
        let lateFee = 0;
        let daysLate = 0;

        if (today > returnDate) {
            // Calculate days late
            daysLate = Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24));
            // Late fee is 5% of daily rate per day late
            const dailyRate = order.items.reduce((sum, item) => sum + (item.dailyRate * item.quantity), 0);
            lateFee = Math.round(dailyRate * 0.05 * daysLate);
        }

        res.json({
            daysLate,
            lateFee,
            returnDate: order.returnDate,
            isOverdue: daysLate > 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// CUSTOMER RETURN REQUESTS
// ==========================================

// @desc    Create a return request (Customer)
// @route   POST /api/returns/request
// @access  Private (Customer)
const createReturnRequest = async (req, res) => {
    try {
        const { orderId, items, reason, reasonDetails, preferredDate, customerNotes } = req.body;

        // Get the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify customer owns this order
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to return this order' });
        }

        // Check order status allows returns
        if (!['picked_up', 'active'].includes(order.status)) {
            return res.status(400).json({ message: 'This order cannot be returned at this time' });
        }

        // Generate request number
        const count = await ReturnRequest.countDocuments();
        const requestNumber = `RET-${String(count + 1).padStart(5, '0')}`;

        // Create return request
        const returnRequest = await ReturnRequest.create({
            requestNumber,
            order: orderId,
            orderNumber: order.orderNumber,
            customer: req.user._id,
            customerName: req.user.name,
            customerEmail: req.user.email,
            vendor: order.vendor,
            vendorName: order.vendorName,
            items: items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                returnQuantity: item.returnQuantity,
                condition: item.condition || 'good',
            })),
            reason,
            reasonDetails,
            preferredDate: preferredDate ? new Date(preferredDate) : null,
            customerNotes,
            status: 'pending',
        });

        res.status(201).json(returnRequest);
    } catch (error) {
        console.error('Create return request error:', error);
        res.status(500).json({ message: 'Error creating return request', error: error.message });
    }
};

// @desc    Get customer's return requests
// @route   GET /api/returns/my-requests
// @access  Private (Customer)
const getMyReturnRequests = async (req, res) => {
    try {
        const requests = await ReturnRequest.find({ customer: req.user._id })
            .populate('order', 'orderNumber status')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching return requests', error: error.message });
    }
};

// @desc    Get vendor's return requests
// @route   GET /api/returns/requests
// @access  Private (Vendor)
const getVendorReturnRequests = async (req, res) => {
    try {
        const requests = await ReturnRequest.find({ vendor: req.user._id })
            .populate('order', 'orderNumber status pickupDate returnDate')
            .populate('customer', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching return requests', error: error.message });
    }
};

// @desc    Update return request status (Vendor)
// @route   PUT /api/returns/request/:id/status
// @access  Private (Vendor)
const updateReturnRequestStatus = async (req, res) => {
    try {
        const { status, scheduledDate, vendorNotes, refundAmount } = req.body;

        const returnRequest = await ReturnRequest.findById(req.params.id);
        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        // Verify vendor owns this return request
        if (returnRequest.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update fields
        returnRequest.status = status || returnRequest.status;
        if (scheduledDate) returnRequest.scheduledDate = new Date(scheduledDate);
        if (vendorNotes) returnRequest.vendorNotes = vendorNotes;
        if (refundAmount !== undefined) returnRequest.refundAmount = refundAmount;

        // If completed, update product availability and order
        if (status === 'completed') {
            returnRequest.completedDate = new Date();

            // Update order items returned quantity
            const order = await Order.findById(returnRequest.order);
            if (order) {
                for (const returnItem of returnRequest.items) {
                    const orderItem = order.items.find(
                        i => i.productId.toString() === returnItem.productId.toString()
                    );
                    if (orderItem) {
                        orderItem.returnedQuantity = (orderItem.returnedQuantity || 0) + returnItem.returnQuantity;
                    }

                    // Update product availability
                    await Product.findByIdAndUpdate(returnItem.productId, {
                        $inc: { available: returnItem.returnQuantity }
                    });
                }

                // Check if all items returned
                const allReturned = order.items.every(
                    item => (item.returnedQuantity || 0) >= item.quantity
                );
                if (allReturned) {
                    order.status = 'returned';
                    order.actualReturnDate = new Date();
                }

                await order.save();
            }
        }

        await returnRequest.save();
        res.json(returnRequest);
    } catch (error) {
        console.error('Update return status error:', error);
        res.status(500).json({ message: 'Error updating return request', error: error.message });
    }
};

// @desc    Get single return request
// @route   GET /api/returns/request/:id
// @access  Private
const getReturnRequest = async (req, res) => {
    try {
        const returnRequest = await ReturnRequest.findById(req.params.id)
            .populate('order')
            .populate('customer', 'name email phone')
            .populate('items.productId', 'name images');

        if (!returnRequest) {
            return res.status(404).json({ message: 'Return request not found' });
        }

        // Verify user has access
        const isCustomer = returnRequest.customer._id.toString() === req.user._id.toString();
        const isVendor = returnRequest.vendor?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCustomer && !isVendor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(returnRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching return request', error: error.message });
    }
};

// @desc    Get orders eligible for return (Customer)
// @route   GET /api/returns/eligible-orders
// @access  Private (Customer)
const getEligibleOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            customer: req.user._id,
            status: { $in: ['picked_up', 'active'] }
        }).populate('items.productId', 'name images');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching eligible orders', error: error.message });
    }
};

module.exports = {
    getReturns,
    processReturn,
    calculateLateFee,
    createReturnRequest,
    getMyReturnRequests,
    getVendorReturnRequests,
    updateReturnRequestStatus,
    getReturnRequest,
    getEligibleOrders,
};

