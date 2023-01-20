'use strict';

// Load necessary modules
const dgram = require('dgram'); // for UDP communications
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto'); // To generate random numbers
const path = require('path');

const consts = require(path.join(__dirname, '..', '..', 'constants'));
const tp = require(consts.TORRENT_PARSER);
const util = require(consts.UTIL);

/*
UDP Tracker protocol:
    1) Send a connect request.
	2) Get connect response and extract connection_id.
	3) Send announce request w/ connection_id.
	4) Get announce response and extract peer list.

The messages are sent using BEP format.
*/


// Get peers from tracker
module.exports.getPeers = (trackerUrl, torrent, cb) => {
    getTrackerInfo(trackerUrl, torrent, false, (trackerInfo) => {
        if (trackerInfo) {
            cb(trackerInfo.peers);
        }
    });
};

// Notify tracker we are seeding
module.exports.notifySeeding = (trackerUrl, torrent, cb) => {
    getTrackerInfo(trackerUrl, torrent, true, (trackerInfo) => {
        cb(trackerInfo);
    });
};

function getTrackerInfo(trackerUrl, torrent, seeding, cb) {
    // Create UDP socket
    const socket = dgram.createSocket('udp4');

    // Callback if there is an error with transmission
    const udpCb = (err) => {
        if (err) {
            console.log(err);
            socket.end();
        }
    };

    // 1. Send Connection Request
    const connReq = buildConnReq();
    udpSend(socket, connReq, trackerUrl, udpCb);
    console.log('%s: 1) Connection Request sent.', trackerUrl);

    // Store transactionId
    var originalTransactionId = connReq.readUInt32BE(12);


    // Set up socket listener for incoming messages
    socket.on('message', response => {
        if (respType(response) === 'connect') {
            // 2. Receive connect response
            const connResp = parseConnResp(response, originalTransactionId);

            // Check for error
            if (!connResp) {
                socket.end();
                return;
            }

            console.log("%s: 2) Connection Response Received.", trackerUrl);


            // 3. Send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent, seeding);

            originalTransactionId = announceReq.readUInt32BE(12);

            udpSend(socket, announceReq, trackerUrl, udpCb);

            console.log("%s: 3) Announce Request sent!", trackerUrl);

        } else if (respType(response) === 'announce') {
            // 4. Parse announce response
            const announceResp = parseAnnounceResp(response, originalTransactionId);

            // Check for error
            if (!announceResp) {
                socket.end();
                return;
            }

            console.log("%s: 4) Announce Request Received.", trackerUrl);

            // 5. Pass announce response to callback
            cb(announceResp);
            socket.end();
            return;
        }
    });
}

// Send message through UDP socket
function udpSend(socket, message, rawUrl, cb = () => {}) {
    // TODO: implement retrial after timeout
    const url = urlParse(rawUrl);

    socket.send(message, 0, message.length, url.port, url.hostname, cb);
}

// Identify type of incoming response
function respType(resp) {
	const action = resp.readUInt32BE(0); // response type at begining
	if (action === 0) return 'connect';
	if (action === 1) return 'announce';
}

// Build Connection Request message
function buildConnReq() {
/*
    Offset  Size            Name            Value
    0       64-bit integer  protocol_id   0x41727101980
    8       32-bit integer  action          0 // connect
    12      32-bit integer  transaction_id  ? // random
    16
*/    
    const buf = Buffer.alloc(16);
    
    // Write protocol_id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);
    
    // Write action
    buf.writeUInt32BE(0, 8);
    
    // Write transaction_id
    crypto.randomBytes(4).copy(buf, 12);
    
    return buf;
}


// Parse Connection Response
function parseConnResp(resp, originalTransactionId) {
/*
    Offset  Size            Name            Value
    0       32-bit integer  action          0 // connect
    4       32-bit integer  transaction_id
    8       64-bit integer  connection_id
    16
*/

    // Check size
    if (Buffer.byteLength(resp) != 16) {
        console.log('2) Connection Response length wrong.');
        return null;
    }

    // Check transaction_id
    if (originalTransactionId != resp.readUInt32BE(4)) {
        console.log('2) Transaction ID does not match.');
        return null;
    }
    
    // Return json with parameters extracted from response
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}


// Build Announce Request message
function buildAnnounceReq(connId, torrent, seeding, port=consts.CLIENT_PORT) {
/*
    Offset  Size    Name    Value
    0       64-bit integer  connection_id
    8       32-bit integer  action          1 // announce
    12      32-bit integer  transaction_id
    16      20-byte string  info_hash
    36      20-byte string  peer_id
    56      64-bit integer  downloaded
    64      64-bit integer  left
    72      64-bit integer  uploaded
    80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped
    84      32-bit integer  IP address      0 // default
    88      32-bit integer  key             ? // random
    92      32-bit integer  num_want        -1 // default
    96      16-bit integer  port            ? // should be betwee
    98
*/
    const buf = Buffer.allocUnsafe(98);
    
    // Connection ID
    connId.copy(buf, 0);
    
    // Action
    buf.writeUInt32BE(1, 8);
    
    // Transaction ID
    crypto.randomBytes(4).copy(buf, 12);
    
    // Info Hash
    tp.infoHash(torrent).copy(buf, 16);
    
    // Peer ID
    util.genId().copy(buf, 36);
    
    if (!seeding) {
        // Requesting for download
        // Downloaded
        Buffer.alloc(8).copy(buf, 56);
    
        // Left
        tp.size(torrent).copy(buf, 64);

        // Uploaded
        // TODO: implement correctly
        Buffer.alloc(8).copy(buf, 72);

        // Event
        buf.writeUInt32BE(1, 80);
    } else {
        // For seeding
        // Downloaded
        tp.size(torrent).copy(buf, 56);

        // Left
        Buffer.alloc(8).copy(buf, 64);

        // Uploaded
        // TODO: implement correctly
        Buffer.alloc(8).copy(buf, 72);

        // Event
        buf.writeUInt32BE(2, 80);
    }
    
    
    // IP Address
    // TODO: Check
    buf.writeUInt32BE(0, 84);
    
    // Key
    crypto.randomBytes(4).copy(buf, 88);
    
    // Num Want
    buf.writeInt32BE(-1, 92);
    
    // Port
    buf.writeUInt16BE(port, 96);
    
    return buf;
}


// Parse Announce Response message
function parseAnnounceResp(resp, originalTransactionId) {
/*
    Offset      Size            Name            Value
    0           32-bit integer  action          1 // announce
    4           32-bit integer  transaction_id
    8           32-bit integer  interval
    12          32-bit integer  leechers
    16          32-bit integer  seeders
    20 + 6 * n  32-bit integer  IP address
    24 + 6 * n  16-bit integer  TCP port
    20 + 6 * N
*/
    // Function to retrieve peers
    function group(iterable, groupSize) {
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
            groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
    }
    
    // Check size
    if ((Buffer.byteLength(resp) - 20)%6 != 0) {
        console.log('4) Announce Response length wrong.');
        return;
    }

    // Check transaction_id
    if (originalTransactionId != resp.readUInt32BE(4)) {
        console.log('4) Transaction ID does not match.');
        return null;
    }
    
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        interval: resp.readUInt32BE(8),
        leechers: resp.readUInt32BE(12),
        seeders: resp.readUInt32BE(16),
        peers: group(resp.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            }
        })
    }
}