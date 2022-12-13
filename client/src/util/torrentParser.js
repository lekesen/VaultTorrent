'use strict';

// Load necessary modules
const Buffer = require('buffer').Buffer;
const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

// Parse torrent file and return as JSON
module.exports.open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath));
};

// Hash (SHA-1) info section of torrent file to create 'Info Hash'
module.exports.infoHash = (torrent) => {
    
}