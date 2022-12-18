'use strict';

// Load necessary modules
const fs = require('fs');
const net = require('net');
const tracker = require('../trackerClient/trackerClient');
const message = require('../util/message');
const consts = require('../util/constants');

// Load necessary classes
const Pieces = require('../util/Pieces');
const Queue = require('../util/Queue');

// ONLY DOWNLOADS 1 FILE

// Main function
module.exports = (torrent, download_path) => {
    // Create files to save downloaded data
	const file = fs.openSync(download_path + 'download_tmp', 'w');

    // Create Pieces object, to orchestrate download with different peers
    const pieces = new Pieces(torrent);

    // Get peer list and start download
    tracker.getPeers(torrent, peers => {
		peers.forEach(peer => { download(peer, torrent, pieces, file); });
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
function download(peer, torrent, pieces, file) {
    // Create TCP socket
    const socket = new net.Socket();

    socket.on('error', (err) => console.log(err));

    // Establish TCP connection and send handshake
    socket.connect(peer.port, peer.ip, () => {
		socket.write(message.buildHandshake(torrent));
    });

    // Set up socket listener
    const queue = new Queue(torrent);
    onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, file));
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
function msgHandler(msg, socket, pieces, queue, torrent, file) {
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
		if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload);
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
function pieceHandler(socket, pieces, queue, torrent, file, pieceResp) {
	// Show download progress
    // TODO: implement with UI
	

	if (!pieces.isDone()) {
		pieces.addReceived(pieceResp);
		pieces.printPercentDone();
		const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
		// Write data to files
		fs.writeSync(file, pieceResp.block, 0, pieceResp.block.length, offset, (err) => {
			if (err) {
				console.log(err);
			}
		});

		if (pieces.isDone()) {
			// If download has finished, close the socket and file
			socket.end();
			try { 
				fs.closeSync(file);
				saveDataToFiles(torrent);
			} catch(e) {console.log(e);}
		} else {
			// If more pieces to be downloaded, request more
			requestPiece(socket,pieces, queue);
		}

	} else {
		// Close other sockets
		socket.end();
	}
}

function saveDataToFiles(torrent) {
	var files = [];
	var fileLengths = [];
	if (!torrent.info.files) {
		// Only 1 file
		const file = fs.openSync('./files/downloads/' + torent.info.name.toString(), 'w');
		files.push(file);

		fileLengths.push(torrent.info.pieces.length*torrent.info['piece length']/20);
	} else {
		// More than one files
		for (var i=0; i<torrent.info.files.length; i++) {
			const file = fs.openSync('./files/downloads/' + torrent.info.files[i].path.toString(), 'w');
			files.push(file);
			fileLengths.push(torrent.info.files[i].length);
		}
	}

	fs.open('./files/downloads/download_tmp', 'r', function(error, fd) {
		if (error) {
			console.log(error);
			return;
		}
		var offset = 0;
		for (var i=0; i<files.length; i++) {
			var blockBuf = Buffer.alloc(fileLengths[i]);
			const file = files[i];
			const fileLength = fileLengths[i];

			fs.read(fd, blockBuf, 0, fileLength, offset, (err, bytesRead, blockBuf) => {
				if (err) {
					console.log(err);
					return;
				}

				fs.writeSync(file, blockBuf, 0, blockBuf.length, 0, (err) => {
					if (err) {
						console.log(err);
					}
				});
				try { fs.closeSync(file); } catch(e) {console.log(e);}
			});
			offset += fileLength;
		}
	});
}

function writeToFile(torrent, files, fileLengths, message) {
	// Write to download file
	var messageOffset = message.index * torrent.info['piece length'] + message.begin;
	var fileOffset = 0;
	var messageLength = message.block.length;
	for (var i=0; i<files.length; i++) {
		if (fileOffset <= messageOffset && (fileOffset + fileLengths[i]) > (messageOffset + messageLength)) {
			// Write full data
			fs.writeSync(files[i], message.block, 0, messageLength, messageOffset-fileOffset, (err) => {
				if (err) {
					console.log(err);
				}
			});
			return;
		} else if (fileOffset <= messageOffset && (fileOffset+fileLengths[i]) > messageOffset && (fileOffset + fileLengths[i]) < (messageOffset + messageLength)) {
			// Write part of data
			fs.writeSync(files[i], message.block, 0, fileOffset+fileLengths[i]-messageOffset, messageOffset-fileOffset, (err) => {
				if (err) {
					console.log(err);
				}
			});
		} else if (fileOffset >= messageOffset && (fileOffset + fileLengths[i]) > (messageOffset + messageLength)) {
			// Write part of data
			fs.writeSync(files[i], message.block, fileOffset-messageOffset, messageLength - (fileOffset-messageOffset), 0, (err) => {
				if (err) {
					console.log(err);
				}
			});
			return;
		}
		fileOffset += fileLengths[i];
	}


	/*
	
	*/
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