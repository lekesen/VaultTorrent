'use strict';

// Load necessary modules
const createTorrent = require('create-torrent');
const fs = require('fs');
const path = require('node:path');

const tp = require('../util/torrentParser');

// Create Torrent from file
module.exports = (filePath, outputPath, cb) => {
    const opts = {
        announceList: ['udp://10.0.2.8:8080']
    };
    createTorrent(filePath, opts, (err, torrent) => {
        if (!err) {
            fs.writeFile(outputPath, torrent, (err) => {
                if(err) {
                    console.log(err);
                }
                cb();
            });
        }
    });
};