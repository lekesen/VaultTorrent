'use strict';

// Load necessary modules
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

const consts = require(path.join(__dirname, 'constants'));

// Function to encrypt vault
module.exports.encrypt = (folderPath, compressedPath, encryptedPath, key, cb) => {
    // Compress vault to .tar
    exec('tar -czvf ' + compressedPath + ' -C ' + folderPath + ' .', (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
        if (stderr) {
            console.log(stderr);
        }

        // Encrypt compressed vault
        const cipher = crypto.createCipheriv(consts.ENC_ALG, key, consts.ENC_IV);
        const input = fs.createReadStream(compressedPath);
        const output = fs.createWriteStream(encryptedPath);
        
        input.pipe(cipher).pipe(output);
        
        output.on('finish', function() {
            cb();
        });
    });
};

// Function to decrypt vault
module.exports.decrypt = (folderPath, compressedPath, encryptedPath, key, cb) => {
    // Decrypt compressed vault
    const cipher = crypto.createDecipheriv(consts.ENC_ALG, key, consts.ENC_IV);
    const input = fs.createReadStream(encryptedPath);
    const output = fs.createWriteStream(compressedPath);
    
    input.pipe(cipher).pipe(output);
    
    // Uncompress vault once it is decrypted
    output.on('finish', function() {
        exec('tar -xvf ' + compressedPath + ' -C ' + folderPath, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }
            if (stderr) {
                console.log(stderr);
            }

            cb({})
        });
    });
};