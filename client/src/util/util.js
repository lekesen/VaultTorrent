'use strict';

// Load necessary modules
const crypto = require('crypto');

// Client ID
let id = null;
module.exports.genId = () => {
    // Generate id if it doesn't exist
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-AT0001-').copy(id, 0);
    }
    return id;
}