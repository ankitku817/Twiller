const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb'); // Use MongoClient from mongodb package
const topicRoutes = require('./routes/topicRoutes'); // Import the topic routes

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection URI
const uri = "mongodb+srv://ankit:12345@twitter.qyeix.mongodb.net/?retryWrites=true&w=majority&appName=twitter";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db("database"); // Specify the database name

    // Use the topic routes
    app.use('/api/topics', topicRoutes);

    app.post('/register', async (req, res) => {
      const user = req.body;
      try {
        const result = await db.collection("users").insertOne(user);
        res.send(result);
      } catch (error) {
        res.status(500).send('Error registering user');
      }
    });

    // Endpoint to get logged-in user details
    app.get('/loggedinuser', async (req, res) => {
      const email = req.query.email;
      try {
        const user = await db.collection("users").findOne({ email: email });
        if (user) {
          res.json(user);
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        res.status(500).send('Error fetching user details');
      }
    });

    // Endpoint to fetch trending topics
    app.get('/api/trending-topics', async (req, res) => {
      try {
        const trendingTopics = await db.collection("posts").find().sort({ createdAt: -1 }).limit(10).toArray();
        res.send(trendingTopics.map(post => ({ name: post.topic })));
      } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching trending topics');
      }
    });

    // Endpoint to search topics
    app.get('/api/search-topics', async (req, res) => {
      try {
        const { term } = req.query;
        if (!term) {
          return res.status(400).send('Search term is required');
        }
        const topics = await db.collection("topics").find({ name: new RegExp(term, 'i') }).toArray();
        res.json(topics);
      } catch (error) {
        res.status(500).send('Error searching topics');
      }
    });

    app.get('/', (req, res) => {
      res.send("Twiller is working");
    });

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

run().catch(console.dir);
