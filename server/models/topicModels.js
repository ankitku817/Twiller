const { ObjectId } = require('mongodb');
const { client } = require('../config/dbConfig');

const topicCollection = client.db("database").collection("topics");

// Function to add a new topic
exports.addTopic = async (topic) => {
  try {
    const result = await topicCollection.insertOne(topic);
    return result;
  } catch (error) {
    console.error("Error adding topic:", error);
    throw error;
  }
};

// Function to retrieve all trending topics
exports.getTrendingTopics = async () => {
  try {
    const topics = await topicCollection.find({}).toArray();
    return topics;
  } catch (error) {
    console.error("Error retrieving trending topics:", error);
    throw error;
  }
};

// Function to search topics based on a search term
exports.searchTopics = async (term) => {
  try {
    const regex = new RegExp(term, 'i'); // Case-insensitive search
    const topics = await topicCollection.find({ name: regex }).toArray();
    return topics;
  } catch (error) {
    console.error("Error searching topics:", error);
    throw error;
  }
};

// Function to update a topic
exports.updateTopic = async (id, updatedTopic) => {
  try {
    const result = await topicCollection.updateOne(
      { _id: ObjectId(id) },
      { $set: updatedTopic }
    );
    return result;
  } catch (error) {
    console.error("Error updating topic:", error);
    throw error;
  }
};

// Function to delete a topic
exports.deleteTopic = async (id) => {
  try {
    const result = await topicCollection.deleteOne({ _id: ObjectId(id) });
    return result;
  } catch (error) {
    console.error("Error deleting topic:", error);
    throw error;
  }
};
