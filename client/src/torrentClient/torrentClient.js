'use strict';

// Load necessary modules
const path = require('path');

const consts = require(path.join(__dirname, '..', 'constants'));
const create = require(consts.CREATE_TORRENT);
const download = require(consts.LEECH_TORRENT);
const seeder = require(consts.SEED_TORRENT);
const tp = require(consts.TORRENT_PARSER);


// Create torrent file from 1 file
module.exports.createTorrent = (filePath, outputPath, cb) => {
    create(filePath, outputPath, cb);
};

// Download resources from torrent
module.exports.downloadTorrent = (torrentPath, filePath, cb) => {
    const torrent = tp.open(torrentPath);
    if (!torrent) { return; }
    console.log(tp.infoHash(torrent));
    download(torrent, filePath, cb);
};

// Start seeding
module.exports.startSeeding = (torrentPath, filePath) => {
    const torrent = tp.open(torrentPath);
    
    if (!torrent) { return; }
    console.log(tp.infoHash(torrent));
    seeder.startSeeding(torrent, filePath);
};

// Stop seeding
module.exports.stopSeeding = () => {
    seeder.stopSeeding();
};