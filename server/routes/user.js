// routes/user.js
const express = require("express");
const router = express.Router();
const Users = require("../models/Users");
const upload = require("../upload");

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
// Fetch current user's profile
router.get("/me", verifyToken, async (req, res) => {
    try {
        const user = await Users.findById(req.user.id);
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Update user's profile
router.put("/:id", [verifyToken, upload.fields([{ name: "profileImage", maxCount: 1 }, { name: "coverImage", maxCount: 1 }])], async (req, res) => {
    const { username, bio, dob, website } = req.body;
    const profileImage = req.files?.profileImage ? req.files.profileImage[0].path : null;
    const coverImage = req.files?.coverImage ? req.files.coverImage[0].path : null;

    try {
        const user = await Users.findById(req.params.id);

        if (!user) return res.status(404).send("User not found");

        // Update user details
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.dob = dob || user.dob;
        user.website = website || user.website;
        if (profileImage) user.profileImage = profileImage;
        if (coverImage) user.coverImage = coverImage;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
