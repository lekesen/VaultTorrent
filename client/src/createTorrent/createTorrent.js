'use strict';

// Load necessary modules
const createTorrent = require('create-torrent');
const fs = require('fs');
const path = require('node:path');

// Create Torrent from file
module.exports.createTorrent = (filePath) => {
    const opts = {
        announceList: ['udp://10.0.2.8:8080']
    };
    createTorrent(filePath, opts, (err, torrent) => {
        if (!err) {
            fs.writeFile('./files/torrents/'+path.posix.basename(filePath)+'.torrent', torrent, (err) => {
                if(err) {
                    console.log(err);
                }
            });
        }
    });
};