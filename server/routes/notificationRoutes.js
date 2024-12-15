const express = require('express');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification'); // Assuming you have a Notification model

const router = express.Router();
const JWT_SECRET = '52c7d68a1a002eb7f1b10fc4d2510150926904906b6ad1e5ff863b9b8f33c8c66476b7dfe6c36b579964951059bc89ff1f4f0f3ccd140fe141e9e2546f49d3a6';

// Middleware to verify JWT for protected routes
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Invalid token:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// 1. GET /api/notifications - Fetch notifications for the logged-in user
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. PUT /api/notifications/:id/mark-as-read - Mark a notification as read
router.put('/notifications/:id/mark-as-read', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found or you do not have permission' });
        }

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/notifications/mark-all-as-read', verifyToken, async (req, res) => {
    try {
        // Update all unread notifications for the logged-in user
        const result = await Notification.updateMany(
            { userId: req.user.id, read: false },
            { $set: { read: true } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ error: 'No unread notifications found' });
        }

        res.json({ message: 'All unread notifications marked as read.' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. DELETE /api/notifications/:id - Delete a notification
router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found or you do not have permission' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
