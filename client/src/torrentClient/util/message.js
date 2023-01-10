'use strict';

// Load necessary modules
const Buffer = require('buffer').Buffer;

const tp = require('./torrentParser');
const util = require('.');

/* 
    TYPES OF MESSAGES
    Handshake message:
        handshake: <pstrlen><pstr><reserved><info_hash><peer_id>

        pstrlen: string length of <pstr>, as a single raw byte
        pstr: string identifier of the protocol
        reserved: eight (8) reserved bytes. All current implementations use all zeroes.
        infoHash
        peer_id: 20-byte string used as a unique ID for the client.

        In version 1.0 of the BitTorrent protocol, pstrlen = 19, and pstr = "BitTorrent protocol".
    
    Other messages:
        4 bytes indicating the length of the message (excluding these 4 bytes)
        1 byte for the id message
        the rest of the buffer is the message payload which varies by message
*/

// Handshake message
module.exports.buildHandshake = torrent => {
    const buf = Buffer.alloc(68);

    // pstrlen
    buf.writeUInt8(19, 0);

    // pstr
    buf.write('BitTorrent protocol', 1);

    // reserved
    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);

    // info hash
    tp.infoHash(torrent).copy(buf, 28);

    // peer id
    util.genId().copy(buf, 48);

    return buf;
};

// Keep Alive message
module.exports.buildKeepAlive = () => Buffer.alloc(4);

// Choke message. Seeder --> peer
module.exports.buildChoke = () => {
    const buf = Buffer.alloc(5);
    
    // length
    buf.writeUInt32BE(1, 0);

    // id
    buf.writeUInt8(0, 4);
    
    return buf;
};

// Unchoke message
module.exports.buildUnchoke = () => {
    const buf = Buffer.alloc(5);
    
    // length
    buf.writeUInt32BE(1, 0);
    
    // id
    buf.writeUInt8(1, 4);
    
    return buf;
};

// Interested message
module.exports.buildInterested = () => {
    const buf = Buffer.alloc(5);
    
    // length
    buf.writeUInt32BE(1, 0);
    
    // id
    buf.writeUInt8(2, 4);
    
    return buf;
};

// Uninterested message
module.exports.buildUninterested = () => {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);

    // id
    buf.writeUInt8(3, 4);

    return buf;
};

// Have message
module.exports.buildHave = payload => {
    const buf = Buffer.alloc(9);

    // length
    buf.writeUInt32BE(5, 0);
    
    // id
    buf.writeUInt8(4, 4);
    
    // piece index
    buf.writeUInt32BE(payload, 5);
  
    return buf;
};

// Bitfield message
module.exports.buildBitfield = bitfield => {
    const buf = Buffer.alloc(bitfield.length + 1 + 4);

    // length
    buf.writeUInt32BE(bitfield.length + 1, 0);
    
    // id
    buf.writeUInt8(5, 4);
    
    // bitfield
    bitfield.copy(buf, 5);
    
    return buf;
};


// Request message
module.exports.buildRequest = payload => {
	const buf = Buffer.alloc(17);
    
	// length
    buf.writeUInt32BE(13, 0);
    
	// id
    buf.writeUInt8(6, 4);
    
	// piece index
    buf.writeUInt32BE(payload.index, 5);
    
	// begin
    buf.writeUInt32BE(payload.begin, 9);
    
	// length
    buf.writeUInt32BE(payload.length, 13);
    
	return buf;
};

// Piece message
module.exports.buildPiece = payload => {
	const buf = Buffer.alloc(payload.block.length + 13);
    
	// length
    buf.writeUInt32BE(payload.block.length + 9, 0);
    
	// id
    buf.writeUInt8(7, 4);
    
	// piece index
    buf.writeUInt32BE(payload.index, 5);
    
	// begin
    buf.writeUInt32BE(payload.begin, 9);
    
	// block
    payload.block.copy(buf, 13);
    
	return buf;
};

// Cancel message
module.exports.buildCancel = payload => {
	const buf = Buffer.alloc(17);
    
	// length
    buf.writeUInt32BE(13, 0);
    
	// id
    buf.writeUInt8(8, 4);
    
	// piece index
    buf.writeUInt32BE(payload.index, 5);
    
	// begin
    buf.writeUInt32BE(payload.begin, 9);
    
	// length
    buf.writeUInt32BE(payload.length, 13);
    
	return buf;
};

// Port message
module.exports.buildPort = payload => {
	const buf = Buffer.alloc(7);
    
	// length
    buf.writeUInt32BE(3, 0);
    
	// id
    buf.writeUInt8(9, 4);
    
	// listen-port
    buf.writeUInt16BE(payload, 5);
    
	return buf;
};
  
// Parse incomming message
module.exports.parse = msg => {
	// Check if it is a keep-ahead message (has no id)
	const id = msg.length > 4 ? msg.readInt8(4) : null;
    
	// If length lesser than 5, it has no payload
    let payload = msg.length > 5 ? msg.slice(5) : null;
    
	if (id === 6 || id === 7 || id === 8) {
		const rest = payload.slice(8);
		
		payload = {
			index: payload.readUInt32BE(0),
			begin: payload.readUInt32BE(4)
		};
		payload[id === 7 ? 'block' : 'length'] = rest;
    }
	
	return {
		size : msg.readInt32BE(0),
		id : id,
		payload : payload
	}
};