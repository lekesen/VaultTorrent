'use strict';

// Load necessary modules
const path = require('path');
const create = require(path.join(__dirname, 'create', 'createTorrent'));
const download = require(path.join(__dirname, 'download', 'download'));
const tp = require(path.join(__dirname, 'util', 'torrentParser'));
const seeder = require(path.join(__dirname, 'seeder', 'seeder'));

module.exports.createTorrent = (filePath, outputPath, cb) => {
    create(filePath, outputPath, cb);
};

module.exports.downloadTorrent = (torrentPath, filePath, cb) => {
    const torrent = tp.open(torrentPath);
    download(torrent, filePath, cb);
};

module.exports.startSeeding = (torrentPath, filePath) => {
    const torrent = tp.open(torrentPath);
    seeder.startSeeding(torrent, filePath);
};

module.exports.stopSeeding = (torrentPath) => {
    const torrent = tp.open(torrentPath);
    seeder.stopSeeding(torrent);
}