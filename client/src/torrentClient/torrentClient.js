'use strict';

// Load necessary modules
const path = require('path');

const consts = require(path.join(__dirname, '..', 'constants'));
const create = require(consts.CREATE_TORRENT);
const download = require(consts.LEECH_TORRENT);
const seeder = require(consts.SEED_TORRENT);
const tp = require(consts.TORRENT_PARSER);


module.exports.createTorrent = (filePath, outputPath, cb) => {
    create(filePath, outputPath, cb);
};

module.exports.downloadTorrent = (torrentPath, filePath, cb) => {
    const torrent = tp.open(torrentPath);
    if (!torrent) { return; }
    download(torrent, filePath, cb);
};

module.exports.startSeeding = (torrentPath, filePath) => {
    const torrent = tp.open(torrentPath);
    if (!torrent) { return; }
    seeder.startSeeding(torrent, filePath);
};

module.exports.stopSeeding = (torrentPath) => {
    const torrent = tp.open(torrentPath);
    if (!torrent) { return; }
    seeder.stopSeeding(torrent);
};