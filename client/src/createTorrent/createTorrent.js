'use strict';

// Load necessary modules
const createTorrent = require('create-torrent');
const fs = require('fs');
const path = require('node:path');

// Create Torrent from file
module.exports.createTorrent = (filePath) => {
    createTorrent(filePath, (err, torrent) => {
        if (!err) {
            fs.writeFile('./torrents/'+path.posix.basename(filePath)+'.json');
        }
    });
};