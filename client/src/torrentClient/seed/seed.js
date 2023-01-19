'use strict';

// Load necessary modules
const fs = require('fs');
const net = require('net');
const path = require('path');

const consts = require(path.join(__dirname, '..', '..', 'constants'));
const tracker = require(consts.TRACKER_CLIENT);
const message = require(consts.MESSAGE);
const tp = require(consts.TORRENT_PARSER);

// ONLY SEEDING FOR 1 TORRENT!
var server = null;
var clients = [];

module.exports.startSeeding = (torrent, filePath) => {
    tracker.startSeeding(torrent);

    // TCP Server
	server= net.createServer();
	server.listen(consts.CLIENT_PORT, consts.CLIENT_IP, () => {
		console.log("TCP BitTorrent server listerning at port" + consts.CLIENT_PORT);
	});

	server.on('error', (err) => console.log(err));
	server.on('connection', socket => {
		console.log('CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
        clients.push(socket);
		onWholeMsg(socket, msg => msgHandler(msg, socket, torrent, filePath));
		socket.on('error', (err) => console.log(err));
        socket.on('close', () => {
			console.log('closed');
			
			// TODO
            //clients.splice(clients.indexOf(socket), 1);
        });
	});
};

module.exports.stopSeeding = (torrent) => {
    tracker.stopSeeding(torrent);
    for (var i in clients) {
        clients[i].destroy();
    }
	if (server) {
		server.close(function () {
			console.log('server closed.');
			server.unref();
		});
	}
};

function onWholeMsg(socket, callback) {
	let savedBuf = Buffer.alloc(0);
	let handshake = true;

	// Set up socket listener
	socket.on('data', recvBuf => {
		// Calculate message length depending on wether it is first message (handshake) or not
		const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readUInt32BE(0) + 4;

		// Save received information
		savedBuf = Buffer.concat([savedBuf, recvBuf]);

		// When buffer is long enough to contain a message, pass it to callback
		while(savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
			// Send packet to callback
			callback(savedBuf.slice(0, msgLen()));

			// Remove packet from buffer
			savedBuf = savedBuf.slice(msgLen());

			// We have received at least a message --> no more handshakes
			handshake = false;
		}
	});
}

// Message handler functions
function msgHandler(msg, socket, torrent, filePath) {
	if (isHandshake(msg)) {
		// If it is hanshake, send handshake and bitfield
		socket.write(message.buildHandshake(torrent));
		const nPieces = torrent.info.pieces.length / 20;
		
		var bitfieldArray = new Array(Math.ceil(nPieces/8)).fill(0);
		for (var i=0; i<nPieces; i++){
			const byteIndex = Math.trunc(i / 8);
			const offset = i%8;
			
			bitfieldArray[byteIndex] = bitfieldArray[byteIndex] | (1<<(7-offset));
		}
		var bitfield = Buffer.alloc(bitfieldArray.length);
		for (var i=0; i< bitfieldArray.length; i++) {
			bitfield.writeUint8(bitfieldArray[i], i);
		}
		console.log(bitfieldArray);
		console.log(bitfield);
		socket.write(message.buildBitfield(bitfield));
	} else {
		const m = message.parse(msg);
		// Depending on message ID, send to a specific handler

		if (m.id === 2) interestedHandler(socket, torrent);
		if (m.id === 3) uninterestedHandler(socket);
		if (m.id === 6) pieceRequestHandler(socket, torrent, filePath, m.payload);
	}
}

// return whether a message is Handshake or not
function isHandshake(msg) {
	return msg.length === msg.readUInt8(0) + 49 &&
	msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}


function interestedHandler(socket, torrent) {
	//Some clients (Deluge for example) send bitfield with missing pieces even if it has all data. Then it sends rest of pieces as have messages. They are saying this helps against ISP filtering of BitTorrent protocol. It is called lazy bitfield.
	// Send have packets
    
    // Unchoke
	socket.write(message.buildUnchoke());
}

function uninterestedHandler() {
	// Not strictly necessary to do anything (?)
}

function pieceRequestHandler(socket, torrent, filePath, pieceRequest) {
	// See which piece it requests
	const pieceIndex = pieceRequest.index;
	const blockBegin = pieceRequest.begin;
	const blockLength = pieceRequest.length.readInt32BE(0);

    // Read data and send through socket
	fs.open(filePath, 'r', function(error, fd) {
		if (error) {
			console.log(error);
			return;
		}
		
		var blockBuf = Buffer.alloc(blockLength);
		fs.read(fd, blockBuf, 0, blockLength, pieceIndex*torrent.info['piece length'] + blockBegin, (err, bytesRead, blockBuf) => {
			if (err) {
				console.log(err);
				return;
			}
			
			let payload = {
				index: pieceIndex,
				begin: blockBegin,
				block: blockBuf
			};
			socket.write(message.buildPiece(payload));
		});
	});
}