const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getNotificationSettings,
    updateNotificationSettings
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.put('/password', protect, changePassword);

router.route('/notifications')
    .get(protect, getNotificationSettings)
    .put(protect, updateNotificationSettings);

module.exports = router;
