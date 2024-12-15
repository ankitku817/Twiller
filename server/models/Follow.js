const mongoose = require('mongoose');

// Define the Follow schema
const followSchema = new mongoose.Schema({
    followerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: true
    },
    followedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: true
    },
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Prevent a user from following the same user multiple times
followSchema.index({ followerUserId: 1, followedUserId: 1 }, { unique: true });

// Export the Follow model
const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
