'use strict';

// Load necessary modules
const path = require('path');
const create = require(path.join(__dirname, 'create', 'createTorrent'));


module.exports.createTorrent = (filePath, outputPath, cb) => {
    create(filePath, outputPath, cb);
}; 