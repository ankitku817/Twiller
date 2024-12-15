const express = require('express');
const router = express.Router();
const topicModels = require('../models/topicModels');
const { TwitterApi } = require('twitter-api-v2');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

const handleApiResponse = (res, status, data, error = null) => {
  res.status(status).json({
    success: status >= 200 && status < 300,
    data,
    error,
  });
};

router.get('/trending', async (req, res) => {
  try {
    const trendingTopics = await topicModels.getTrendingTopics();
    handleApiResponse(res, 200, trendingTopics);
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    handleApiResponse(res, 500, null, 'Error fetching trending topics');
  }
});

router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.trim() === '') {
      return handleApiResponse(res, 400, null, 'Search term is required');
    }
    const topics = await topicModels.searchTopics(term);
    handleApiResponse(res, 200, topics);
  } catch (error) {
    console.error('Error searching topics:', error);
    handleApiResponse(res, 500, null, 'Error searching topics');
  }
});

let isRateLimited = false; // Flag to prevent multiple retries
let requestQueue = []; // Queue to hold requests

const processQueue = () => {
  if (requestQueue.length === 0 || isRateLimited) return;

  const { req, res } = requestQueue.shift(); // Get the next request from the queue

  // Process the request
  handleTwitterSearch(req, res);
};

const handleTwitterSearch = async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === '') {
    return handleApiResponse(res, 400, null, 'Query is required');
  }

  // Check cache
  const cachedResponse = cache.get(query);
  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  try {
    const tweetsResponse = await twitterClient.v2.search(query, {
      max_results: 10,
      'tweet.fields': ['created_at', 'text'],
      'user.fields': ['username'],
      expansions: ['author_id'],
    });

    // Check if tweetsResponse.data is an array
    if (!Array.isArray(tweetsResponse.data)) {
      console.error('Unexpected response structure:', tweetsResponse);
      return handleApiResponse(res, 500, null, 'Unexpected response structure from Twitter API');
    }

    const usersMap = new Map(
      tweetsResponse.includes?.users.map((user) => [user.id, user.username]) || []
    );

    const tweetData = tweetsResponse.data.map((tweet) => ({
      text: tweet.text,
      user: usersMap.get(tweet.author_id),
      created_at: tweet.created_at,
      url: `https://twitter.com/${usersMap.get(tweet.author_id)}/status/${tweet.id}`,
    }));

    const response = { tweets: tweetData };
    cache.set(query, response); // Cache the response
    handleApiResponse(res, 200, response);
  } catch (error) {
    console.error('Error fetching tweets:', error);

    // Handle rate limiting
    if (error.code === 429) {
      if (!isRateLimited) {
        isRateLimited = true; // Set the flag to prevent multiple retries
        const resetTime = error.headers['x-rate-limit-reset'];
        const resetDate = new Date(resetTime * 1000); // Define resetDate here
        const waitTime = resetDate.getTime() - Date.now();

        console.log('Rate limit exceeded. Waiting until:', resetDate);
        setTimeout(() => {
          isRateLimited = false; // Reset the flag after waiting
          processQueue(); // Process the next request in the queue
        }, waitTime);

        return handleApiResponse(res, 429, null, `Rate limit exceeded. Try again at: ${resetDate}`);
      }
    }

    handleApiResponse(res, 500, null, 'Failed to fetch tweets');
  }
};

router.post('/twitter/search', (req, res) => {
  requestQueue.push({ req, res }); // Add the request to the queue
  processQueue(); // Process the queue
});

router.post('/add', async (req, res) => {
  try {
    const topic = req.body;
    if (!topic.name || !topic.createdAt) {
      return handleApiResponse(res, 400, null, 'Topic name and creation date are required');
    }
    const result = await topicModels.addTopic(topic);
    handleApiResponse(res, 201, result);
  } catch (error) {
    console.error('Error adding topic:', error);
    handleApiResponse(res, 500, null, 'Error adding topic');
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedTopic = req.body;
    if (!id || Object.keys(updatedTopic).length === 0) {
      return handleApiResponse(res, 400, null, 'Invalid update data');
    }
    const result = await topicModels.updateTopic(id, updatedTopic);
    handleApiResponse(res, 200, result);
  } catch (error) {
    console.error('Error updating topic:', error);
    handleApiResponse(res, 500, null, 'Error updating topic');
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return handleApiResponse(res, 400, null, 'Topic ID is required');
    }
    const result = await topicModels.deleteTopic(id);
    handleApiResponse(res, 200, result);
  } catch (error) {
    console.error('Error deleting topic:', error);
    handleApiResponse(res, 500, null, 'Error deleting topic');
  }
});

module.exports = router;
