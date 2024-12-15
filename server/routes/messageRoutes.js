const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation'); // Import Conversation model

const JWT_SECRET = '52c7d68a1a002eb7f1b10fc4d2510150926904906b6ad1e5ff863b9b8f33c8c66476b7dfe6c36b579964951059bc89ff1f4f0f3ccd140fe141e9e2546f49d3a6';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization token required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded user:', decoded);  // Log decoded token for debugging
        req.user = { _id: decoded.id };  // Explicitly assign _id to req.user
        next();
    } catch (error) {
        console.error('Invalid token:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

router.post('/messages', verifyToken, async (req, res) => {
    const { receiverEmail, content } = req.body;

    if (!receiverEmail || !content) {
        return res.status(400).json({ error: 'Receiver email and message content are required' });
    }

    try {
        console.log('Sender ID from token:', req.user._id);  // Log the sender ID from the token
        const sender = await User.findById(req.user._id);
        console.log('Sender:', sender);  // Log sender details

        console.log('Receiver email:', receiverEmail);  // Log the receiver email
        const receiver = await User.findOne({ email: receiverEmail });
        console.log('Receiver:', receiver);  // Log receiver details

        if (!sender) return res.status(404).json({ error: 'Sender not found' });
        if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

        // Check if a conversation already exists between the sender and receiver
        let conversation = await Conversation.findOne({
            participants: { $all: [sender._id, receiver._id] }
        });

        // If no conversation exists, create a new one
        if (!conversation) {
            conversation = new Conversation({
                participants: [sender._id, receiver._id],
                lastMessage: content,
                createdAt: new Date(),
            });
            await conversation.save();
        }

        // Create a new message and link it to the conversation
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: sender._id,
            receiver: receiver._id,
            content,
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/messages/:conversationId', verifyToken, async (req, res) => {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    try {
        const messages = await Message.find({ conversationId });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Fetch all conversations for the logged-in user
router.get('/messages', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user._id }, { receiver: req.user._id }],
        })
            .populate('sender receiver', 'name email')
            .sort({ createdAt: -1 });

        const conversations = messages.map((message) => {
            return {
                conversationId: message._id,
                participants: [message.sender, message.receiver],
                lastMessage: message.content,
                createdAt: message.createdAt,
            };
        });

        res.status(200).json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
