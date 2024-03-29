'use strict';

// Load necessary modules
const fs = require('fs');
const net = require('net');
const path = require('path');

const consts = require(path.join(__dirname, '..', '..', 'constants'));

const tracker = require(consts.TRACKER_CLIENT);
const message = require(consts.MESSAGE);

// Load necessary classes
const Pieces = require(consts.PIECES);
const Queue = require(consts.QUEUE);

// ONLY DOWNLOADS 1 FILE

// Main function
module.exports = (torrent, downloadPath, cb) => {
    // Create file to save downloaded data
    const file = fs.openSync(downloadPath, 'w');

    // Create Pieces object, to orchestrate download with different peers
    const pieces = new Pieces(torrent);

    // Get peer list and start download
    tracker.getPeers(torrent, peers => {
		peers.forEach(peer => { download(peer, torrent, pieces, file, cb); });
	});
};

/*
    Steps to download from peer;
        1) Establish TCP Conncetion with peer
        2) Peer set up
	    3) Start piece requests until we have finished
	    4) Store pieces in hdd
*/

// Download from 1 peer
function download(peer, torrent, pieces, file, cb) {
    // Create TCP socket
    const socket = new net.Socket();

    socket.on('error', (err) => console.log(err));

    // Establish TCP connection and send handshake
    socket.connect(peer.port, peer.ip, () => {
		socket.write(message.buildHandshake(torrent));
    });

    // Set up socket listener
    const queue = new Queue(torrent);
    onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, file, cb));
}

// Listen until a packet is full
function onWholeMsg(socket, cb) {
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
            cb(savedBuf.slice(0, msgLen()));
            
            // Remove packet from buffer
			savedBuf = savedBuf.slice(msgLen());

			// We have received at least a message --> no more handshakes
			handshake = false;
		}
	});
}

// Message handler function
function msgHandler(msg, socket, pieces, queue, torrent, file, cb) {
    if (isHandshake(msg)) {
		// If it is hanshake, show we are interested
		socket.write(message.buildInterested());
	} else {
		const m = message.parse(msg);

		// Depending on message ID, send to a specific handler
		if (m.id === 0) chokeHandler(socket);
		if (m.id === 1) unchokeHandler(socket, pieces, queue);
		if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
		if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
		if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload, cb);
	}
}

// Check if message is a handshake or not
function isHandshake(msg) {
	return msg.length === msg.readUInt8(0) + 49 && msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}

// If we are choked, close the socket
function chokeHandler(socket) {
	socket.end();
}

// If we are unchoked, start requesting pieces
function unchokeHandler(socket, pieces, queue) {
	queue.choked = false;
	requestPiece(socket, pieces, queue);
}

// If we receive have message
function haveHandler(socket, pieces, queue, payload) {
	// Get piece index from message
	const pieceIndex = payload.readUInt32BE(0);

	// Know if peer queue is empty (no pending pieces)
	const queueEmpty = queue.length === 0;

	// Put piece on queue
	queue.queue(pieceIndex);

	// If queue is empty (no pending pieces), request piece
	if (queueEmpty) requestPiece(socket, pieces, queue);
}

// If we receive bitfield message
function bitfieldHandler(socket, pieces, queue, payload) {
  const queueEmpty = queue.length === 0;

  // Parse to know which pieces the peer has and set them to the queue
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  });

  // If queue is empty (no pending pieces), request piece
  if (queueEmpty) requestPiece(socket, pieces, queue);
}


// If we receive a piece
function pieceHandler(socket, pieces, queue, torrent, file, pieceResp, cb) {
	// Show download progress
	pieces.printPercentDone();
	
	if (!pieces.isDone()) {
		pieces.addReceived(pieceResp, torrent);

		if (pieces.isPieceDone(pieceResp.index)) {
			
			// If download of a piece has finished, check for it's integrity
			if (pieces.checkPieceIntegrity(pieceResp.index, torrent)) {
				// If piece is OK, write to file.
				const offset = pieceResp.index * torrent.info['piece length'];
				const piece = pieces.getPiece(pieceResp.index);
				fs.writeSync(file, piece, 0, piece.length, offset, (err) => {
					if (err) {
						console.log(err);
					}
				});
				if (pieces.isDone()) {
					// If download has finished, close the socket and file
					socket.end();
					try { fs.closeSync(file); cb();} catch(e) {console.log(e);}
				} else {
					// If more pieces to be downloaded, request more
					requestPiece(socket, pieces, queue);
				}
			} else {
				// Error with piece integrity.
				console.log('Error with piece integrity! Try download again.');
				//TODO: Retry download. How to recover elements from queue?
			}
		}
	} else {
		// Close socket if download has finished
		socket.end();
	}
	
}


// Request a piece
function requestPiece(socket, pieces, queue) {
	// If choked, cannot request pieces
	if (queue.choked) return null;
	
	// While there +1 elements on queue
	while (queue.length()) {
		const pieceBlock = queue.deque();
		// If piece is still needed (maybe requested for another peer)
		if (pieces.needed(pieceBlock)) {
			socket.write(message.buildRequest(pieceBlock));
			pieces.addRequested(pieceBlock);
			break;
        }
	}
}