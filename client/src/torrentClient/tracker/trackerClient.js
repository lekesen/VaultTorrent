'use strict';

// Load necessary modules
const udpTracker = require('./udpTracker');
const httpTracker = require('./httpTracker');

var programmedNotifySeed = {};

// Get peers from tracker
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

// Tell tracker client is seeding
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

// Stop seeding
module.exports.stopSeeding = () => {
    // Stop periodic announce requests
    for (const [key, value] of Object.entries(programmedNotifySeed)) {
        clearTimeout(programmedNotifySeed[key]);
        delete programmedNotifySeed[key];
    }
};

// Get trackers from torrent
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

// Retrieve peers from a tracker
function getPeersFromTracker(trackerUrl, torrent, cb) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        udpTracker.getPeers(trackerUrl, torrent, cb);
    } else if (trackerUrl.startsWith('http://')) {
        // HTTP tracker
        httpTracker.getPeers(trackerUrl, torrent, cb);
    }
}

// Tell a tracker we are seeding
function notifySeeding(trackerUrl, torrent) {
    if (trackerUrl.startsWith('udp://')) {
        // UDP tracker
        const notifyCb = (trackerInfo) => {
            delete programmedNotifySeed[trackerUrl];

            function scheduledNotify() {
                notifySeeding(trackerUrl, torrent);
            }
            const timeoutObj = setTimeout(scheduledNotify, trackerInfo.interval*1000);
            programmedNotifySeed[trackerUrl] =  timeoutObj;
        };
        
        udpTracker.notifySeeding(trackerUrl, torrent, notifyCb);

    } else if (trackerUrl.startsWith('http://')) {
        // HTTP tracker
        httpTracker.startSeeding(trackerUrl, torrent, cb);
    }
}