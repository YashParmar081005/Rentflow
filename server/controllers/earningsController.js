const Order = require('../models/Order');
const Invoice = require('../models/Invoice');

// @desc    Get earnings data for vendor
// @route   GET /api/earnings
// @access  Private/Vendor
const getEarnings = async (req, res) => {
    try {
        const { range } = req.query; // '1m', '6m', '1y'

        // Date range calculation
        const now = new Date();
        let startDate = new Date();

        if (range === '1m') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (range === '6m') {
            startDate.setMonth(startDate.getMonth() - 6);
        } else if (range === '1y') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        } else {
            startDate.setMonth(startDate.getMonth() - 6); // Default
        }

        const dateQuery = { $gte: startDate };

        // 1. Calculate Total Revenue and Chart Data from PAID INVOICES
        let invoiceQuery = {
            status: 'paid',
            updatedAt: dateQuery
        };

        if (req.user.role === 'vendor') {
            invoiceQuery.vendor = req.user._id;
        }

        const paidInvoices = await Invoice.find(invoiceQuery).sort({ updatedAt: -1 });

        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

        // Chart Data Generation
        let chartData = [];
        if (range === '1m') {
            // Group by week
            const weeks = [0, 0, 0, 0];
            paidInvoices.forEach(inv => {
                const weekNum = Math.floor((now - new Date(inv.updatedAt)) / (7 * 24 * 60 * 60 * 1000));
                if (weekNum >= 0 && weekNum < 4) {
                    weeks[3 - weekNum] += inv.totalAmount || 0;
                }
            });
            chartData = weeks.map((revenue, i) => ({ name: `Week ${i + 1}`, revenue }));
        } else if (range === '1y') {
            // Group by month
            const months = Array(12).fill(0);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            paidInvoices.forEach(inv => {
                const monthIndex = new Date(inv.updatedAt).getMonth();
                months[monthIndex] += inv.totalAmount || 0;
            });
            chartData = months.map((revenue, i) => ({ name: monthNames[i], revenue }));
        } else {
            // Group by last 6 months
            const months = Array(6).fill(0);
            const monthNames = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                monthNames.push(d.toLocaleString('default', { month: 'short' }));
            }
            paidInvoices.forEach(inv => {
                const payDate = new Date(inv.updatedAt);
                const monthsAgo = (now.getFullYear() - payDate.getFullYear()) * 12 + (now.getMonth() - payDate.getMonth());
                if (monthsAgo >= 0 && monthsAgo < 6) {
                    months[5 - monthsAgo] += inv.totalAmount || 0;
                }
            });
            chartData = months.map((revenue, i) => ({ name: monthNames[i], revenue }));
        }

        // 2. Get Total Orders count (from Orders)
        let orderQuery = {};
        if (req.user.role === 'vendor') {
            orderQuery.vendor = req.user._id;
        }
        orderQuery.status = { $in: ['completed', 'returned'] };
        const totalOrders = await Order.countDocuments(orderQuery);

        // 3. Pending Payouts (Unpaid Invoices)
        let pendingQuery = {
            status: { $ne: 'paid' } // Not paid
        };
        if (req.user.role === 'vendor') {
            pendingQuery.vendor = req.user._id;
        }
        const pendingInvoices = await Invoice.find(pendingQuery);
        // Sum balanceAmount for pending payouts
        const pendingPayouts = pendingInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

        // 4. Growth (Compare with previous period)
        const previousStartDate = new Date(startDate);
        previousStartDate.setTime(previousStartDate.getTime() - (now.getTime() - startDate.getTime()));

        const previousQuery = {
            status: 'paid',
            updatedAt: { $gte: previousStartDate, $lt: startDate }
        };
        if (req.user.role === 'vendor') {
            previousQuery.vendor = req.user._id;
        }

        const previousInvoices = await Invoice.find(previousQuery);
        const previousRevenue = previousInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

        let growth = 0;
        if (previousRevenue > 0) {
            growth = ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);
        } else if (totalRevenue > 0) {
            growth = 100;
        }

        // 5. Recent Transactions
        const recentTransactions = paidInvoices.slice(0, 10).map(inv => ({
            id: inv._id,
            orderNumber: inv.orderNumber,
            customerName: inv.customerName,
            amount: inv.totalAmount,
            date: inv.updatedAt,
            status: 'completed'
        }));

        res.json({
            totalRevenue,
            totalOrders,
            pendingPayouts,
            averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            growth: parseFloat(growth),
            chartData,
            recentTransactions
        });

    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payout history
// @route   GET /api/earnings/payouts
// @access  Private/Vendor
const getPayouts = async (req, res) => {
    try {
        // Return payouts based on Paid Invoices
        let query = {
            status: 'paid'
        };

        if (req.user.role === 'vendor') {
            query.vendor = req.user._id;
        }

        const invoices = await Invoice.find(query)
            .sort({ updatedAt: -1 })
            .limit(20);

        const payouts = invoices.map((inv, index) => ({
            id: inv._id,
            orderNumber: inv.orderNumber,
            amount: inv.totalAmount,
            date: inv.updatedAt,
            method: index % 2 === 0 ? 'bank' : 'upi', // Mock method
            status: 'completed'
        }));

        res.json(payouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getEarnings,
    getPayouts
};
