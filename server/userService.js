const User = require('./models/User'); // Assuming you have a User model

const getUserByEmail = async (email) => {
    if (!email) {
        throw new Error('Email is required');
    }

    try {
        const user = await User.findOne({ email }); // Find user by email
        return user;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error;
    }
};

module.exports = { getUserByEmail };
