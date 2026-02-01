const Invoice = require('../models/Invoice');
const Order = require('../models/Order');

// @desc    Get all invoices for logged in user
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
    try {
        let invoices;
        if (req.user.role === 'admin') {
            invoices = await Invoice.find({}).sort({ createdAt: -1 });
        } else {
            invoices = await Invoice.find({ customer: req.user._id }).sort({ createdAt: -1 });
        }
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('order');
        if (invoice) {
            // Access check
            if (req.user.role !== 'admin' && invoice.customer.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            res.json(invoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create invoice (Internal/Admin use)
// @access  Private
const createInvoice = async (order) => {
    // This function acts as a helper to be called from orderController or elsewhere
    // It is NOT an express middleware itself, but a helper.
    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // Default 15 days due

        const invoice = new Invoice({
            invoiceNumber: `INV-${Date.now()}`,
            order: order._id,
            orderNumber: order.orderNumber,
            customer: order.customer,
            customerName: order.customerName,
            vendor: order.vendor,
            items: order.items.map(item => ({
                productName: item.productName, // Assuming these fields exist on order items
                quantity: item.quantity,
                rentalDays: item.rentalDays,
                dailyRate: item.dailyRate,
                amount: item.subtotal
            })),
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            totalAmount: order.totalAmount,
            balanceAmount: order.totalAmount, // Initially full amount is due
            status: 'pending',
            dueDate: dueDate,
        });

        await invoice.save();
        return invoice;
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
};

// @desc    Pay an invoice
// @route   PUT /api/invoices/:id/pay
// @access  Private
const payInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('order');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Access check (only customer or admin can pay)
        if (req.user.role !== 'admin' && invoice.customer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (invoice.status === 'paid') {
            return res.status(400).json({ message: 'Invoice is already paid' });
        }

        // Update invoice status
        invoice.status = 'paid';
        invoice.paidAmount = invoice.totalAmount;
        invoice.balanceAmount = 0;

        await invoice.save();

        // Update Vendor Revenue
        if (invoice.order && invoice.order.vendor) {
            const User = require('../models/User'); // Import User model here to avoid circular dependency issues if any
            await User.findByIdAndUpdate(invoice.order.vendor, {
                $inc: {
                    walletBalance: invoice.totalAmount,
                    totalRevenue: invoice.totalAmount
                }
            });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Pay invoice error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInvoices,
    getInvoiceById,
    createInvoice,
    payInvoice,
};
