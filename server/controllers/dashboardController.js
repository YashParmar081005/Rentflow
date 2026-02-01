const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const Product = require('../models/Product');

// @desc    Get customer dashboard stats
// @route   GET /api/dashboard/customer
// @access  Private
const getCustomerDashboardStats = async (req, res) => {
    try {
        const customerId = req.user._id;

        // Fetch orders
        const orders = await Order.find({ customer: customerId })
            .populate('items.productId')
            .sort({ createdAt: -1 });

        // Fetch invoices
        const invoices = await Invoice.find({ customer: customerId })
            .sort({ createdAt: -1 });

        // Fetch quotations
        const quotations = await Quotation.find({ customer: customerId })
            .sort({ createdAt: -1 });

        // Calculate stats
        const activeOrders = orders.filter(o =>
            ['active', 'picked_up', 'confirmed', 'pending'].includes(o.status)
        );

        const pendingPayments = invoices.filter(i =>
            ['partial', 'overdue', 'pending'].includes(i.status)
        );

        const pendingQuotations = quotations.filter(q =>
            ['draft', 'sent', 'pending'].includes(q.status)
        );

        const totalSpent = invoices
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + i.totalAmount, 0);

        const pendingPaymentAmount = pendingPayments
            .reduce((sum, i) => sum + i.balanceAmount, 0);

        // Recent orders (last 5)
        const recentOrders = orders.slice(0, 5).map(order => ({
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            itemCount: order.items.length,
            productName: order.items[0]?.productName || 'N/A',
            createdAt: order.createdAt
        }));

        // Recent quotations (last 5)
        const recentQuotations = quotations.slice(0, 5).map(quote => ({
            id: quote._id,
            quotationNumber: quote.quotationNumber,
            status: quote.status,
            totalAmount: quote.totalAmount,
            validUntil: quote.validUntil,
            createdAt: quote.createdAt
        }));

        // Spending by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySpending = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.createdAt);
                return invDate >= monthStart && invDate <= monthEnd && inv.status === 'paid';
            });

            const amount = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
            monthlySpending.push({
                name: months[date.getMonth()],
                amount
            });
        }

        res.json({
            stats: {
                activeRentals: activeOrders.length,
                pendingQuotations: pendingQuotations.length,
                totalOrders: orders.length,
                pendingPaymentAmount,
                totalSpent,
                itemsRented: orders.reduce((sum, o) => sum + o.items.length, 0),
                completionRate: orders.length > 0
                    ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100)
                    : 100,
                pendingInvoiceCount: pendingPayments.length
            },
            recentOrders,
            recentQuotations,
            spendingData: monthlySpending
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vendor dashboard stats
// @route   GET /api/dashboard/vendor
// @access  Private/Vendor
const getVendorDashboardStats = async (req, res) => {
    try {
        const vendorId = req.user._id;

        // Fetch vendor's orders
        const orders = await Order.find({ vendor: vendorId })
            .populate('customer', 'name email')
            .populate('items.productId', 'name images')
            .sort({ createdAt: -1 });

        // Fetch vendor's products
        const products = await Product.find({ vendor: vendorId })
            .sort({ createdAt: -1 });

        // Calculate order stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
        const activeRentals = orders.filter(o => ['active', 'picked_up'].includes(o.status)).length;
        const completedOrders = orders.filter(o => o.status === 'completed').length;

        // Revenue calculation
        const totalRevenue = orders
            .filter(o => ['completed', 'picked_up', 'active', 'returned'].includes(o.status))
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // This month's revenue
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthRevenue = orders
            .filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= startOfMonth &&
                    ['completed', 'picked_up', 'active', 'returned'].includes(o.status);
            })
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Last month's revenue for comparison
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthRevenue = orders
            .filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= startOfLastMonth && orderDate <= endOfLastMonth &&
                    ['completed', 'picked_up', 'active', 'returned'].includes(o.status);
            })
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Growth percentage
        const revenueGrowth = lastMonthRevenue > 0
            ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : (thisMonthRevenue > 0 ? 100 : 0);

        // Product stats
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.isActive !== false).length;
        const lowStockProducts = products.filter(p => (p.available || p.stock) < 5).length;

        // Inventory health (products with stock info)
        const inventoryHealth = products.slice(0, 5).map(p => ({
            id: p._id,
            name: p.name,
            available: p.available || p.stock || 0,
            stock: p.stock || 10,
            image: p.images?.[0] || null
        }));

        // Pending pickups (confirmed orders waiting for pickup)
        const pendingPickups = orders.filter(o => o.status === 'confirmed').length;

        // Pending returns (active rentals that need to be returned)
        const pendingReturns = orders.filter(o => ['active', 'picked_up'].includes(o.status)).length;

        // Recent orders (last 10)
        const recentOrders = orders.slice(0, 10).map(order => ({
            id: order._id,
            orderNumber: order.orderNumber,
            customerName: order.customerName || order.customer?.name || 'Customer',
            customerEmail: order.customerEmail || order.customer?.email,
            status: order.status,
            totalAmount: order.totalAmount,
            itemCount: order.items?.length || 0,
            productName: order.items?.[0]?.productName || 'N/A',
            createdAt: order.createdAt,
            pickupDate: order.pickupDate,
            returnDate: order.returnDate
        }));

        // Revenue by month (last 6 months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthOrders = orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= monthStart && orderDate <= monthEnd &&
                    ['completed', 'picked_up', 'active', 'returned'].includes(o.status);
            });

            const revenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            revenueData.push({
                name: months[date.getMonth()],
                revenue
            });
        }

        // Today's activity
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(o => new Date(o.createdAt) >= today).length;
        const todayPickups = orders.filter(o => {
            const pickupDate = o.pickupDate ? new Date(o.pickupDate) : null;
            return pickupDate && pickupDate >= today && pickupDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).length;

        res.json({
            stats: {
                totalRevenue,
                thisMonthRevenue,
                revenueGrowth,
                totalOrders,
                pendingOrders,
                confirmedOrders,
                activeRentals,
                completedOrders,
                pendingPickups,
                pendingReturns,
                totalProducts,
                activeProducts,
                lowStockProducts,
                todayOrders,
                todayPickups
            },
            recentOrders,
            inventoryHealth,
            revenueData
        });

    } catch (error) {
        console.error('Vendor Dashboard error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCustomerDashboardStats,
    getVendorDashboardStats
};
