'use strict';

// Load necessary modules
const dgram = require('dgram'); // for UDP communications
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto'); // to create random numbers

module.exports.getPeers = () => {
    const tracker_url = 'udp://127.0.0.1:8080';

    const socket = dgram.createSocket('udp4');

    const connReq = buildConnReq();
    var originalTransactionId = connReq.readUInt32BE(12); // get Transaction ID

    udpSend(socket, connReq, tracker_url);
    console.log('%s:1) Connection Request sent.', tracker_url);

    socket.on('message', response =>  {
        if (respType(response) === 'connect') {
            // 2. Receive connect response
            const connResp = parseConnResp(response);
            
            // Check if it was correctly parsed
            if (connResp === undefined) {
                console.log('%s: 2) Error parsing Connection Response.', tracker_url);
                return;
            }
            
            // Check if Transaction ID match
            if (connResp.transactionId != originalTransactionId) {
                console.log('%s: 2) Transaction ID does not match.', tracker_url);
                return;
            }
            
            console.log("%s: 2) Connection Response Received.", tracker_url);
            
            
            // 3. Send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId);
            
            originalTransactionId = announceReq.readUInt32BE(12);
            
            udpSend(socket, announceReq, tracker_url);
            
            console.log("%s: 3) Announce Request sent!", tracker_url);
        
        } else if (respType(response) === 'announce') {
            console.log('announce')
            
            // 4. Parse announce response
            const announceResp = parseAnnounceResp(response);
            
            // Check if it was correctly parsed
            if (announceResp === undefined) {
                return;
            }
            
            // Check if transaction ID match
            if (announceResp.transactionId != originalTransactionId) {
                console.log('%s: 4) Transaction ID does not fit', tracker_url);
                return;
            }
            
            console.log("%s: 4) Announce Request Received.", tracker_url);
            
            console.log(announceResp);
            
            // 5. Pass peers to callback
            socket.close();
            return;
        } else {
            // there was an  error
            console.log("Error"); 
            socket.close();
            return;
        }
    });
}
    
// Identify type of incoming response
function respType(resp) {
    const action = resp.readUInt32BE(0); // response type at begining
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
}

// Send UDP message over socket
function udpSend(socket, message, rawUrl, callback=()=>{}) {
    // TODO: try multimple times
	const url = urlParse(rawUrl);
    
    // Default port
    if (url.port === null) { 
        // TODO: implement for wss protocol
        callback('Unsupported protocol');
        return true;
    } 
    
    socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

// Build Connection Request  packet
function buildConnReq() {
/*
    Connect Request:
    Offset  Size            Name            Value
    0       64-bit integer  protocol_id   0x41727101980
    8       32-bit integer  action          0 // connect
    12      32-bit integer  transaction_id  ? // random
    16
*/
    const buf = Buffer.alloc(16); // Create buffer of 16B size
    
    // Write protocol_id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    // Write action
    buf.writeUInt32BE(0, 8);
    
    // Write transaction ID
    crypto.randomBytes(4).copy(buf, 12);
    
    return buf;
}
    
    
// Parse Connection Response
function parseConnResp(resp) {
/*
    Offset  Size            Name            Value
    0       32-bit integer  action          0 // connect
    4       32-bit integer  transaction_id
    8       64-bit integer  connection_id
    16
*/
    // Check size
    if (Buffer.byteLength(resp) != 16) {
        console.log('3) Connection Response length wrong.');
        return;
    }
    
    // Return json with parameters extracted from response
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

// Build Announce Request message
function buildAnnounceReq(connId, port=6881) { // use default port
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
    //torrentParser.infoHash(torrent).copy(buf, 16);
    Buffer.from('aaa67059ed6bd08362da625b3ae77f6f4a075aaa', 'hex').copy(buf, 16);
    
    // Peer ID
    //util.genId().copy(buf, 36); // TODO: Check
    Buffer.alloc(20).copy(buf,36);

    // Downloaded
    Buffer.alloc(8).copy(buf, 56); // TODO: Check
    
    // Left
    Buffer.alloc(8).copy(buf, 56); // TODO: Check 
    //torrentParser.size(torrent).copy(buf, 64);
    
    // Uploaded
    Buffer.alloc(8).copy(buf, 72);// TODO: Check
    
    // Event
    buf.writeUInt32BE(0, 80);
    
    // IP Address
    buf.writeUInt32BE(0, 84); // TODO: Check
    
    // Key
    crypto.randomBytes(4).copy(buf, 88);
    
    // Num Want
    buf.writeInt32BE(-1, 92);
    
    // Port
    buf.writeUInt16BE(port, 96);
    
    return buf;
}
    
// Parse Announce Response message
function parseAnnounceResp(resp) {
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