'use strict';

const tracker = require('./src/trackerClient/trackerClient');
const tp = require('./src/util/torrentParser');

const file_name = './files/torrents/big-buck-bunny.torrent';
const torrent = tp.open(file_name);

tracker.getPeers(torrent, (peer_list) => console.log(peer_list));