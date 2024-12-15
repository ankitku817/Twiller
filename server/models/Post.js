const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }, 
});

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
            required: true,
        },
        username: {
            type: String,
            required: true, 
        },
        email: {
            type: String,
            required: true, 
        },
        userImage: {
            type: String,
            required: true, 
        },
        content: {
            type: String,
            required: true,
            maxlength: 280, 
        },
        contentImages: {
            type: [String], 
            default: [],
        },
        contentVideos: {
            type: [String], 
            default: [],
        },
        contentAudios: {
            type: [String], 
            default: [],
        },
        emojis: {
            type: [String], 
            default: [],
        },
        gifs: {
            type: [String], 
            default: [],
        },
        likes: {
            type: [mongoose.Schema.Types.ObjectId], 
            ref: 'User',
            default: [],
        },
        dislikes: {
            type: [mongoose.Schema.Types.ObjectId], 
            ref: 'User',
            default: [],
        },
        comments: {
            type: [commentSchema],
            default: [],
        },
    },
    {
        timestamps: true, 
    }
);
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
