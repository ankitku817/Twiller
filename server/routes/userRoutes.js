const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Follow = require('../models/Follow');
const router = express.Router();

const JWT_SECRET = '52c7d68a1a002eb7f1b10fc4d2510150926904906b6ad1e5ff863b9b8f33c8c66476b7dfe6c36b579964951059bc89ff1f4f0f3ccd140fe141e9e2546f49d3a6';

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization token required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        console.error('Invalid token:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    },
});
const upload = multer({ storage });

// Fetch current user details
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// router.get('username/:username', async (req, res) => {
//     try {
//         const { username } = req.params;

//         // Perform database query to fetch the user by username
//         const user = await User.findOne({ username });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         res.status(200).json(user);
//     } catch (err) {
//         console.error(err);
//         res.status(400).json({ message: 'Bad Request' });
//     }
// });



router.put('/update-profile', verifyToken, upload.fields([{ name: 'profileImage' }, { name: 'coverImage' }]), async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is attached to the request via JWT middleware
        const { username,name, email, bio, dob, website,location } = req.body;

        // Prepare the update data
        const updateData = {
            username,
            name,
            email,
            bio,
            dob,
            website,
            location,
            profileImage: req.files.profileImage ? req.files.profileImage[0].path : undefined,
            coverImage: req.files.coverImage ? req.files.coverImage[0].path : undefined,
        };

        // Update the user profile
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Delete user account
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Unauthorized action' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.remove();
        res.json({ message: 'User account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch followers
router.get('/:id/followers', async (req, res) => {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const followers = await Follow.find({ followedUserId: id }).populate(
            'followerUserId',
            'username name'
        );
        res.json(followers);
    } catch (error) {
        console.error('Error fetching followers:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch following
router.get('/:id/following', async (req, res) => {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const following = await Follow.find({ followerUserId: id }).populate(
            'followedUserId',
            'username name'
        );
        res.json(following);
    } catch (error) {
        console.error('Error fetching following:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Follow user
router.post('/:id/follow', verifyToken, async (req, res) => {
    const { id } = req.params;
    const followerUserId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (followerUserId === id) {
        return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    try {
        const existingFollow = await Follow.findOne({ followerUserId, followedUserId: id });
        if (existingFollow) {
            return res.status(400).json({ error: 'You are already following this user' });
        }

        const follow = new Follow({ followerUserId, followedUserId: id });
        await follow.save();
        res.status(201).json({ message: 'User followed successfully' });
    } catch (error) {
        console.error('Error following user:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Unfollow user
router.delete('/:id/unfollow', verifyToken, async (req, res) => {
    const { id } = req.params;
    const followerUserId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const follow = await Follow.findOneAndDelete({ followerUserId, followedUserId: id });
        if (!follow) {
            return res.status(400).json({ error: 'You are not following this user' });
        }

        res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
        console.error('Error unfollowing user:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
