const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.company = req.body.company || user.company;
            user.gstin = req.body.gstin || user.gstin;
            user.address = req.body.address || user.address;

            // Update avatar if provided
            if (req.body.avatar) {
                user.avatar = req.body.avatar;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                company: updatedUser.company,
                gstin: updatedUser.gstin,
                address: updatedUser.address,
                avatar: updatedUser.avatar,
                notificationSettings: updatedUser.notificationSettings
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get notification settings
// @route   GET /api/users/notifications
// @access  Private
const getNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notificationSettings');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Default settings if not set
        const defaultSettings = {
            emailNotifications: true,
            orderUpdates: true,
            promotions: false,
            newsletter: false
        };

        res.json(user.notificationSettings || defaultSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update notification settings
// @route   PUT /api/users/notifications
// @access  Private
const updateNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.notificationSettings = {
            emailNotifications: req.body.emailNotifications ?? true,
            orderUpdates: req.body.orderUpdates ?? true,
            promotions: req.body.promotions ?? false,
            newsletter: req.body.newsletter ?? false
        };

        await user.save();

        res.json({
            message: 'Notification settings updated',
            notificationSettings: user.notificationSettings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getNotificationSettings,
    updateNotificationSettings
};
