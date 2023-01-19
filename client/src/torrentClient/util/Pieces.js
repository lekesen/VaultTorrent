'use strict';

// Load necessary modules
const Buffer = require('buffer').Buffer;
const crypto = require('crypto');
const path = require('path');

const consts = require(path.join(__dirname, '..', '..', 'constants'));
const tp = require(consts.TORRENT_PARSER);

// Define Pieces class
module.exports = class {
    constructor(torrent) {
        function buildPiecesArray() {
            // torrent.info.pieces gives a 20-byte-sha1 for each piece
            const nPieces = torrent.info.pieces.length / 20;
            // Array of arrays --> pieces and blocks
            const arr = new Array(nPieces).fill(null);

            return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(false));
        }
        // Store requested and received pieces
        this._requested = buildPiecesArray();
        this._received = buildPiecesArray();
        this._receivedData = new Array(torrent.info.pieces.length / 20).fill(null);
    }
    
    // Mark Piece as requested
    addRequested(pieceBlock) {
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        this._requested[pieceBlock.index][blockIndex] = true;
    }
    
    // Mark piece as received. 
    addReceived(pieceBlock, torrent) {
        // TODO: add to data in order (blocks may arrive out of order)
        const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
        this._received[pieceBlock.index][blockIndex] = true;
        if (!this._receivedData[pieceBlock.index]) {
            // First received block of piece 
            this._receivedData[pieceBlock.index] = Buffer.alloc(tp.pieceLen(torrent, pieceBlock.index));
        }
        this._receivedData[pieceBlock.index].fill(pieceBlock.block, pieceBlock.begin);
    }

    isPieceDone(pieceIndex) {
        this._received[pieceIndex].every(block => {
            if(!block) {
                return false;
            }
        });
        return true;
    }

    checkPieceIntegrity(pieceIndex, torrent) {
        const downloadedHash = Buffer.from(crypto.createHash('sha1').update(this._receivedData[pieceIndex]).digest('hex'), 'hex');
        const expectedHash = torrent.info.pieces.slice(pieceIndex*20, (pieceIndex+1)*20);
        
        return Buffer.compare(downloadedHash, expectedHash) == 0;
    }

    getPiece(pieceIndex) {
        return this._receivedData[pieceIndex];
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