'use strict';

const tracker = require('./src/trackerClient/trackerClient');
const download = require('./src/download/download');
const create = require('./src/createTorrent/createTorrent');
const seed = require('./src/seed/seed');
const tp = require('./src/util/torrentParser');

const file_name = './files/torrents/tgk.jpg.torrent';
const torrent = tp.open(file_name);
const download_path = './files/downloads/tgk.jpg';

seed.startSeeding(torrent, download_path);

//create.createTorrent('./files/downloads/tgk.jpg');

//download(torrent, download_path);