const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://ankit:12345@twitter.qyeix.mongodb.net/?retryWrites=true&w=majority&appName=twitter";
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1
});

module.exports = { client };
