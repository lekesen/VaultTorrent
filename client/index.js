'use strict';

const tracker = require('./src/trackerClient/trackerClient');
const download = require('./src/download/download');
const tp = require('./src/util/torrentParser');

const file_name = './files/torrents/HTTPTracker.torrent';
const torrent = tp.open(file_name);
const download_path = './files/downloads/'+'big_buck_bunny.mp4';

console.log(torrent.info);
download(torrent, download_path);