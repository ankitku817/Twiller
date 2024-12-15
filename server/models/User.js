const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true,
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: function () {
            return !this.firebaseUid; // Only required if firebaseUid is not provided
        },
    },
    profileImage: {
        type: String,
        default: null,  // Store URL or file path for the profile image
    },
    coverImage: {
        type: String,
        default: null,  // Store URL or file path for the cover image
    },
    bio: {
        type: String,
        default: '',  // Store bio of the user
    },
    location: {
        type: String,
        default: '',  // Store user's location
    },
    website: {
        type: String,
        default: '',  // Store user's website
    },
    dob: {
        type: Date,  // Store user's date of birth
        default: null,
    },
}, { timestamps: true });  // `timestamps: true` adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('User', userSchema);
