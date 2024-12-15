require('dotenv').config(); // Ensure dotenv is loaded first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 5000;
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const topicRoutes = require('./routes/topicRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Post = require('./models/Post');
const User = require('./models/User');

app.use(cors());
app.use(express.json());

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploadsdata/');  // Directory where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Ensure a unique file name
  }
});

const upload = multer({ storage: storage });

// API endpoint for file upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Correct the file URL path to be consistent with the static file serving
  const fileUrl = `/uploadsdata/${req.file.filename}`;
  console.log('File uploaded successfully:', fileUrl);
  res.status(200).json({ url: fileUrl });  // Return the correct URL
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Database connection error:', err));

// Serve static files from 'uploadsdata' folder
app.use('/uploadsdata', express.static(path.join(__dirname, 'uploadsdata')));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', postRoutes);  // Changed from '/api/auth' to '/api/posts'
app.use('/api/topics', topicRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);

// Basic route for health check
app.get('/', (req, res) => {
  res.send('Twiller API is working');
});

// Logged-in user route
app.get('/loggedinuser', async (req, res) => {
  console.log(`Received request with query: ${JSON.stringify(req.query)}`);
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching logged-in user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// User post routes
app.get('/userpost', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const posts = await Post.find({ email });
    if (posts.length === 0) {
      return res.status(404).json({ message: 'No posts found' });
    }

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/userpost', async (req, res) => {
  const { email, content } = req.body;
  if (!email || !content) {
    return res.status(400).json({ error: 'Email and content are required' });
  }

  try {
    const newPost = new Post({ email, content });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error submitting post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });

  socket.on('sendMessage', (message) => {
    io.to(message.conversationId).emit('newMessage', message);
    console.log('Message sent to conversation:', message.conversationId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
