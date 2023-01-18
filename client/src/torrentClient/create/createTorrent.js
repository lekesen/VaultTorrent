'use strict';

// Load necessary modules
const createTorrent = require('create-torrent');
const fs = require('fs');
const path = require('path');

const consts = require(path.join(__dirname, '..', '..', 'constants'));
const tp = require(consts.TORRENT_PARSER);

// Create Torrent from file
module.exports = (filePath, outputPath, cb) => {
    console.log(consts.TRACKER_PORT);
    const opts = {
        announceList: ['udp://'+consts.TRACKER_IP+':'+ consts.TRACKER_PORT]
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