const express = require('express');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');


const router = express.Router();
const JWT_SECRET = "52c7d68a1a002eb7f1b10fc4d2510150926904906b6ad1e5ff863b9b8f33c8c66476b7dfe6c36b579964951059bc89ff1f4f0f3ccd140fe141e9e2546f49d3a6";

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied, token missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); 
        req.user = decoded;  
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token', error: error.message });
    }
};


router.post('/posts', verifyToken, async (req, res) => {
    const { email, content, username, userImage, contentImages, contentVideos, contentAudios, emojis, gifs } = req.body;

    // Validate required fields
    if (!email || !content || !username) {
        return res.status(400).json({ error: 'Email, content, and username are required' });
    }

    // Validate content length
    if (content.length > 280) {
        return res.status(400).json({ error: 'Content must not exceed 280 characters' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;

        // Ensure contentImages, contentVideos, contentAudios, emojis, and gifs are arrays
        const postImages = Array.isArray(contentImages) ? contentImages : [];
        const postVideos = Array.isArray(contentVideos) ? contentVideos : [];
        const postAudios = Array.isArray(contentAudios) ? contentAudios : [];
        const postEmojis = Array.isArray(emojis) ? emojis : [];
        const postGifs = Array.isArray(gifs) ? gifs : [];

        // Create a new post
        const newPost = new Post({
            user: userId,
            email,
            content,
            username,
            userImage,
            contentImages: postImages,
            contentVideos: postVideos,
            contentAudios: postAudios,
            emojis: postEmojis,
            gifs: postGifs,
        });

        // Save the post to the database
        await newPost.save();

        // Return the new post in the response
        res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'Error fetching post', error: error.message });
    }
});

router.put('/posts/:id', verifyToken, async (req, res) => {
    const { postContent } = req.body;

    
    if (!postContent) {
        return res.status(400).json({ message: "Post content is required." });
    }

    try {
       
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { postContent },
            { new: true } 
        );

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post); 
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Error updating post', error: error.message });
    }
});



// Delete a post
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
});

// Like a post
router.post('/:id/like', verifyToken, async (req, res) => {
    const { id: postId } = req.params;
    const userId = req.user.userId;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.likes.includes(userId)) {
            return res.status(400).json({ message: 'User already liked this post' });
        }

        post.likes.push(userId);
        await post.save();
        res.status(200).json({ message: 'Post liked' });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/dislike', verifyToken, async (req, res) => {
    const { id: postId } = req.params;
    const userId = req.user.userId;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex !== -1) {
            post.likes.splice(likeIndex, 1);
            await post.save();
            return res.status(200).json({ message: 'Post disliked' });
        }

        return res.status(400).json({ message: 'You have not liked this post' });
    } catch (error) {
        console.error('Error disliking post:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/share', verifyToken, async (req, res) => {
    const { id: postId } = req.params;

    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        res.status(200).json({ message: 'Post shared' });
    } catch (error) {
        console.error('Error sharing post:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/userposts', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }
    try {
        const posts = await Post.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Server error while fetching posts." });
    }
});
router.post("/:postId/comment", verifyToken, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;

    if (!req.user?.id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const comment = await Comment.create({
            content,
            userId: req.user.id,
            postId,
        });
        res.status(201).json({ comment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.delete('/comments/:commentId', verifyToken, async (req, res) => {
    const { commentId } = req.params;

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment' });
        }

        await comment.remove();
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:postId/comments', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('comments');
        if (!post) return res.status(404).json({ message: 'Post not found' });

        res.status(200).json(post.comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
