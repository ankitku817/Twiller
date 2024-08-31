const express = require('express');
const router = express.Router();
const topicModels = require('../models/topicModels'); // Import the topic models

// Route to fetch all trending topics
router.get('/trending', async (req, res) => {
  try {
    const trendingTopics = await topicModels.getTrendingTopics();
    res.setHeader('Content-Type', 'application/json'); // Ensure JSON header
    res.json(trendingTopics); // Send JSON response
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    res.status(500).json({ error: 'Error fetching trending topics' }); // Return JSON response
  }
});

// Route to search topics based on a search term
router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' }); // Return JSON response
    }
    const topics = await topicModels.searchTopics(term);
    res.setHeader('Content-Type', 'application/json'); // Ensure JSON header
    res.json(topics); // Send JSON response
  } catch (error) {
    console.error("Error searching topics:", error);
    res.status(500).json({ error: 'Error searching topics' }); // Return JSON response
  }
});

// Route to add a new topic
router.post('/add', async (req, res) => {
  try {
    const topic = req.body;
    const result = await topicModels.addTopic(topic);
    res.setHeader('Content-Type', 'application/json'); // Ensure JSON header
    res.json(result); // Send JSON response
  } catch (error) {
    console.error("Error adding topic:", error);
    res.status(500).json({ error: 'Error adding topic' }); // Return JSON response
  }
});

// Route to update an existing topic
router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedTopic = req.body;
    const result = await topicModels.updateTopic(id, updatedTopic);
    res.setHeader('Content-Type', 'application/json'); // Ensure JSON header
    res.json(result); // Send JSON response
  } catch (error) {
    console.error("Error updating topic:", error);
    res.status(500).json({ error: 'Error updating topic' }); // Return JSON response
  }
});

// Route to delete a topic
router.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await topicModels.deleteTopic(id);
    res.setHeader('Content-Type', 'application/json'); // Ensure JSON header
    res.json(result); // Send JSON response
  } catch (error) {
    console.error("Error deleting topic:", error);
    res.status(500).json({ error: 'Error deleting topic' }); // Return JSON response
  }
});

module.exports = router;
