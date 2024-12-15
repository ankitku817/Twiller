const crypto = require('crypto');
console.log(crypto.randomBytes(64).toString('hex'));  // Generates a random 64-byte hex string
