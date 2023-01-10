'use strict';

// Load necessary modules
const udpTracker = require('./udpTracker');
const httpTracker = require('./httpTracker');


/*
    There are 3 types of tracker protocol. HTTP, UDP and WS.
    For the moment, only UDP has been implemented.
*/

var programmedNotifySeed = {};

module.exports.getPeers = (torrent, cb) => {
    // Get trackers from torrent
    const trackerArray = getTrackersFromTorrent(torrent);

    if (!trackerArray) {
        // No trackers
        return;
    }

    // Get peers from each tracker
    trackerArray.forEach(tracker => getPeersFromTracker(tracker, torrent, cb));
};

module.exports.startSeeding = (torrent) => {
    // Get trackers from torrent
    const trackerArray = getTrackersFromTorrent(torrent);

    if (!trackerArray) {
        // No trackers
        return;
    }

    // Start periodic announce requests
    trackerArray.forEach(tracker => notifySeeding(tracker, torrent));
};

module.exports.stopSeeding = (torrent) => {
    // Get trackers from torrent
    const trackerArray = getTrackersFromTorrent(torrent);

    if (!trackerArray) {
        // No trackers
        return;
    }

    // Start periodic announce requests
    trackerArray.forEach(tracker => notifyNoSeeding(tracker, torrent));
};

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
        console.log('%s: HTTP protocol unsupported.', trackerUrl);
        // httpTracker.getPeers(trackerUrl, torrent, cb);
    } else {
        // WS or WSS tracker
        console.log('%s: Unsupported protocol.', trackerUrl);
    }
}

function notifySeeding(trackerUrl, torrent) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        const notifyCb = (trackerInfo) => {
            delete programmedNotifySeed[trackerUrl];

            function scheduledNotify() {
                notifySeeding(trackerUrl, torrent);
            }
            const timeoutObj = setTimeout(scheduledNotify, trackerInfo.interval);

            programmedNotifySeed[trackerUrl] =  timeoutObj;
        };
        
        udpTracker.notifySeeding(trackerUrl, torrent, notifyCb);

    } else if (trackerUrl.startsWith('http://')) {
        // HTTP tracker
        console.log('%s: HTTP protocol unsupported.', trackerUrl);
        // httpTracker.startSeeding(trackerUrl, torrent, cb);
    } else {
        // WS or WSS tracker
        console.log('%s: Unsupported protocol.', trackerUrl);
    }
}

function notifyNoSeeding(trackerUrl, torrent) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        // Stop scheduled tasks

        for (const [key, value] of Object.entries(programmedNotifySeed)) {
            clearTimeout(programmedNotify[key]);
            delete programmedNotifySeed[key];
        }

    } else if (trackerUrl.startsWith('http://')) {
        // HTTP tracker
        console.log('%s: HTTP protocol unsupported.', trackerUrl);
        // httpTracker.startSeeding(trackerUrl, torrent, cb);
    } else {
        // WS or WSS tracker
        console.log('%s: Unsupported protocol.', trackerUrl);
    }
}