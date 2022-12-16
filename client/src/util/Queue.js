'use strict';

// Load necessary modules
const tp = require('./torrentParser');

// Define Queue class for piece request management
module.exports = class {
    constructor(torrent) {
        this._torrent = torrent;
        this._queue = [];
        this.choked = true;
    }
    
    // Add to queue
    queue(pieceIndex) {
        const nBlocks = tp.blocksPerPiece(this._torrent, pieceIndex);
        
        for (let i = 0; i < nBlocks; i++) {
            const pieceBlock = {
                index: pieceIndex,
                begin: i * tp.BLOCK_LEN,
                length: tp.blockLen(this._torrent, pieceIndex, i)
            };
            this._queue.push(pieceBlock);
        }
    }
    
    // Get and remove first element from queue
    deque() { return this._queue.shift(); }
    
    // Get first element of queue
    peek() { return this._queue[0]; }
    
    // Return queue length (to check if objects in queue)
    length() { return this._queue.length; }
};