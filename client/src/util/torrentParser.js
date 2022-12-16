'use strict';

// Load necessary modules
const Buffer = require('buffer').Buffer;
const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

// Default block length: 2^14
module.exports.BLOCK_LEN = Math.pow(2, 14);

// Parse torrent file and return as JSON
module.exports.open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

// Hash (SHA-1) info section of torrent file to create 'Info Hash'
module.exports.infoHash = (torrent) => {
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
};

// Return size of torrent files
module.exports.size = torrent => {
    const size = torrent.info.files ? // we can have 1 or more files
	    torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
	    torrent.info.length;

	const big_size = BigInt(size); // size might be bigger than maximum integer size
	const buf = Buffer.allocUnsafe(8);
	buf.writeBigInt64BE(big_size, 0);
	return buf;
};

// Return pieceLength depending on wether we are on last piece or not.
module.exports.pieceLen = (torrent, pieceIndex) => {
    const totalLength = BigInt('0x' + this.size(torrent).toString('hex'));
    const pieceLength = torrent.info['piece length'];
  
    const lastPieceLength = parseInt(totalLength % BigInt(pieceLength));
    const lastPieceIndex = Math.floor(parseInt(totalLength / BigInt(pieceLength)));
  
	return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
};
  
// Return number of blocks for a specific piece
module.exports.blocksPerPiece = (torrent, pieceIndex) => {
	const pieceLength = this.pieceLen(torrent, pieceIndex);
	return Math.ceil(pieceLength / this.BLOCK_LEN);
};
  
// Return block length
module.exports.blockLen = (torrent, pieceIndex, blockIndex) => {
	const pieceLength = this.pieceLen(torrent, pieceIndex);
	
	const lastPieceLength = pieceLength % this.BLOCK_LEN;
	const lastPieceIndex = Math.floor(pieceLength / this.BLOCK_LEN);
	
	return blockIndex === lastPieceIndex ? lastPieceLength : this.BLOCK_LEN;
};