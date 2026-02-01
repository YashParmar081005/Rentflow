const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('vendor', 'name company');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('vendor', 'name company');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Vendor/Admin
const createProduct = async (req, res) => {
    const {
        name,
        description,
        category,
        images,
        dailyRate,
        weeklyRate,
        monthlyRate,
        deposit,
        stock,
        attributes,
    } = req.body;

    try {
        const product = new Product({
            name,
            description,
            category,
            images,
            dailyRate,
            weeklyRate,
            monthlyRate,
            deposit,
            stock,
            available: stock, // Initially available = stock
            attributes,
            vendor: req.user._id,
            vendorName: req.user.name, // Denormalized
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Vendor/Admin
const updateProduct = async (req, res) => {
    const {
        name,
        description,
        category,
        images,
        dailyRate,
        weeklyRate,
        monthlyRate,
        deposit,
        stock,
        attributes,
        status,
    } = req.body;

    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            // Check ownership
            if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized to update this product' });
            }

            product.name = name || product.name;
            product.description = description || product.description;
            product.category = category || product.category;
            product.images = images || product.images;
            product.dailyRate = dailyRate || product.dailyRate;
            product.weeklyRate = weeklyRate || product.weeklyRate;
            product.monthlyRate = monthlyRate || product.monthlyRate;
            product.deposit = deposit || product.deposit;
            product.stock = stock || product.stock;
            product.attributes = attributes || product.attributes;
            product.status = status || product.status;

            // If stock changed, we might need to adjust available.
            // For simplicity, we just save for now. Logic to sync available with active orders is complex.

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Vendor/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(401).json({ message: 'Not authorized to delete this product' });
            }

            // Check for active orders
            const activeOrders = await Order.findOne({
                'items.productId': req.params.id,
                status: { $in: ['pending', 'confirmed', 'picked_up', 'active'] }
            });

            if (activeOrders) {
                return res.status(400).json({ message: 'Cannot delete product with active orders' });
            }

            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
