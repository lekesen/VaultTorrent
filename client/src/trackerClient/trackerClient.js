'use strict';

// Load necessary modules
const udpTracker = require('./udpTracker');
const httpTracker = require('./httpTracker');


/*
    There are 3 types of tracker protocol. HTTP, UDP and WS.
    For the moment, only UDP has been implemented.
*/

var programmedAnnounceReqs = {};

module.exports.getPeers = (torrent, cb) => {
    // Get trackers from torrent
    const trackerArray = getTrackersFromTorrent(torrent);

    if (!trackerArray) {
        // No trackers
        cb([]);
        return;
    }

    // Get peers from each tracker
    trackerArray.forEach(tracker => getPeersFromTracker(tracker, torrent, cb));
};

module.exports.startSeeding = (trackerUrl, torrent) => {
    // Get trackers from torrent
    const trackerArray = getTrackersFromTorrent(torrent);

    if (!trackerArray) {
        // No trackers
        return;
    }

    // Start periodic announce requests
    trackerArray.forEach(tracker => startSeedingToTracker(tracker, torrent));
};

module.exports.stopSeeding = (trackerUrl, torrent) => {
    // Get trackers from torrent
    const trackerArray = getTrackersFromTorrent(torrent);

    if (!trackerArray) {
        // No trackers
        return;
    }

    // Start periodic announce requests
    trackerArray.forEach(tracker => stopSeedingToTracker(tracker, torrent));
}

function getTrackersFromTorrent(torrent) {
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
        return null;
    }

    return trackerArray;
}

function getPeersFromTracker(trackerUrl, torrent, cb) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        udpTracker.getPeers(trackerUrl, torrent, cb);
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

function notifySeeding(trackerUrl, torrent) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        const notifyCb = (trackerInfo) => {
            function scheduledFunction() {
                startSee
            }
        };
        
        udpTracker.notifySeeding(trackerUrl, torrent, notifyCb);
    } else if (trackerUrl.startsWith('http://')) {
        // HTTP tracker
        console.log('HTTP protocol unsupported');
        // httpTracker.startSeeding(trackerUrl, torrent, cb);
    } else {
        // WS or WSS tracker
        console.log('Unsupported protocol');
    }
}

function notifyNoSeeding(trackerUrl, torrent) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        udpTracker.startSeeding(trackeUrl, torrent, cb);
    } else if (trackerUrl.startsWith('http://')) {
        // HTTP tracker
        console.log('HTTP protocol unsupported');
        // httpTracker.startSeeding(trackerUrl, torrent, cb);
    } else {
        // WS or WSS tracker
        console.log('Unsupported protocol');
    }
}