'use strict';

// Load necessary modules
const udpTracker = require('./udpTracker');
const httpTracker = require('./httpTracker');


/*
    There are 3 types of tracker protocol. HTTP, UDP and WS.
    For the moment, only UDP has been implemented.
*/

module.exports.getPeers = (torrent, cb) => {
    // Retrieve trackers from torrent
    var trackerArray = [];

    if (torrent['announce-list']) {
        // +1 tracker
        // Depending on torrent file, we have to parse 2 times
        torrent['announce-list'].forEach(trackerOrList => trackerOrList.toString('utf8').split(',').forEach(tracker => trackerArray.push(tracker)));
    } else if (torrent.announce) {
        // 1 tracker
        trackerArray.push(torrent.announce.toString('utf8'));
    } else {
        // No tracker
        cb(null);
        return;
    }

    // Get peers from each tracker
    trackerArray.forEach(tracker => getPeersFromTracker(tracker, torrent, cb));
};

function getPeersFromTracker(trackerUrl, torrent, cb) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        udpTracker.getPeers(trackeUrl, torrent, cb);
    } else if (trackerUrl.startsWith('http://')) {
        // HTTP tracker
        console.log('HTTP protocol unsupported');
        cb([]);
        // httpTracker.getPeers(trackerUrl, torrent, cb);
    } else {
        // WS or WSS tracker
        console.log('Unsupported protocol');
        cb([]);
    }
}