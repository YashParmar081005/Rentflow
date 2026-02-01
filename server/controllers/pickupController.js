const Order = require('../models/Order');

// @desc    Get pickups for vendor (orders ready for pickup)
// @route   GET /api/pickups
// @access  Private/Vendor
const getPickups = async (req, res) => {
    try {
        let query = {};

        // For vendors, only show their orders
        if (req.user.role === 'vendor') {
            query.vendor = req.user._id;
        }

        // Pickups are orders that are confirmed (ready for pickup) or just picked up
        query.status = { $in: ['confirmed', 'picked_up'] };

        const pickups = await Order.find(query)
            .populate('customer', 'name email phone')
            .populate('items.productId', 'name images')
            .sort({ pickupDate: 1 });

        res.json(pickups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process pickup (mark order as picked up)
// @route   PUT /api/pickups/:id/process
// @access  Private/Vendor
const processPickup = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if vendor owns this order
        if (req.user.role === 'vendor' && order.vendor?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update status to picked_up
        order.status = 'picked_up';
        order.pickupDate = new Date();

        // Update pickedUpQuantity for each item
        if (req.body.items) {
            req.body.items.forEach(item => {
                const orderItem = order.items.find(
                    i => i.productId.toString() === item.productId
                );
                if (orderItem) {
                    orderItem.pickedUpQuantity = item.pickedUpQuantity;
                }
            });
        } else {
            // Default: mark all items as picked up
            order.items.forEach(item => {
                item.pickedUpQuantity = item.quantity;
            });
        }

        const updatedOrder = await order.save();

        res.json({
            message: 'Pickup processed successfully',
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Schedule pickup date
// @route   PUT /api/pickups/:id/schedule
// @access  Private/Vendor
const schedulePickup = async (req, res) => {
    try {
        const { pickupDate, pickupTime } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if vendor owns this order
        if (req.user.role === 'vendor' && order.vendor?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update pickup date
        if (pickupDate) {
            order.pickupDate = new Date(pickupDate);
        }

        // Store pickup time in notes or a separate field
        if (pickupTime) {
            order.notes = `Scheduled pickup time: ${pickupTime}. ${order.notes || ''}`;
        }

        const updatedOrder = await order.save();

        res.json({
            message: 'Pickup scheduled successfully',
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel/Delete a pickup (set order back to pending or cancelled)
// @route   DELETE /api/pickups/:id
// @access  Private/Vendor
const cancelPickup = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if vendor owns this order
        if (req.user.role === 'vendor' && order.vendor?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // If it's just confirmed, set back to pending. If picked up, set to cancelled
        if (order.status === 'confirmed') {
            order.status = 'pending';
        } else {
            order.status = 'cancelled';
        }

        const updatedOrder = await order.save();

        res.json({
            message: 'Pickup cancelled successfully',
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPickups,
    processPickup,
    schedulePickup,
    cancelPickup
};
