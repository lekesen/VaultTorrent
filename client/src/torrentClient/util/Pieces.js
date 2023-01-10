'use strict';

// Load necessary modules
const tp = require('./torrentParser');

// Define Pieces class
module.exports = class {
    constructor(torrent) {
        function buildPiecesArray() {
            // torrent.info.pieces gives a 20-bit-sha for each piece
            const nPieces = torrent.info.pieces.length / 20;
            // Array of arrays --> pieces and blocks
            const arr = new Array(nPieces).fill(null);

            return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(false));
        }
        // Store requested and received pieces
        this._requested = buildPiecesArray();
        this._received = buildPiecesArray();
    }
    
    // Mark Piece as requested
    addRequested(pieceBlock) {
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        this._requested[pieceBlock.index][blockIndex] = true;
    }
    
    // Mark piece as received
    addReceived(pieceBlock) {
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        this._received[pieceBlock.index][blockIndex] = true;
    }
    
    // Tell if piece is needed or it has already been requested/ received
    needed(pieceBlock) {
        if (this._requested.every(blocks => blocks.every(i => i))) {
            this._requested = this._received.map(blocks => blocks.slice());
        }
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        return !this._requested[pieceBlock.index][blockIndex];
    }
    
    // See if all pieces have been downloaded
    isDone() {
        return this._received.every(blocks => blocks.every(i => i));
    }
    
    // Show download % in screen
    printPercentDone() {
        const downloaded = this._received.reduce((totalBlocks, blocks) => {
            return blocks.filter(i => i).length + totalBlocks;
        }, 0);
        
        const total = this._received.reduce((totalBlocks, blocks) => {
            return blocks.length + totalBlocks;
        }, 0);
        
        const percent = Math.floor(downloaded / total * 100);
        
        process.stdout.write('progress: ' + percent + '%\r');
    }
};