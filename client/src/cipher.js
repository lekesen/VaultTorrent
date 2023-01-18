'use strict';

// Load necessary modules
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');

// TODO: define in constant file
const algorithm = 'aes-256-cbc';
// TODO: IV in 
const iv = Buffer.from('14189dc35ae35e75ff31d7502e245cd9', 'hex');

module.exports.encrypt = (folderPath, compressedPath, encryptedPath, key, cb) => {
    // Convert folder to .tgz
    exec('tar -czvf ' + compressedPath + ' -C ' + folderPath + ' .', (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
        if (stderr) {
            console.log(stderr);
        }

        // Encrypt
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const input = fs.createReadStream(compressedPath);
        const output = fs.createWriteStream(encryptedPath);
        
        input.pipe(cipher).pipe(output);
        
        output.on('finish', function() {
            console.log('Encrypted file written to disk!');
            cb();
        });
    });
};

module.exports.decrypt = (folderPath, compressedPath, encryptedPath, key, cb) => {
    // Decrypt
    const cipher = crypto.createDecipheriv(algorithm, key, iv);
    const input = fs.createReadStream(encryptedPath);
    const output = fs.createWriteStream(compressedPath);
    
    input.pipe(cipher).pipe(output);
    
    output.on('finish', function() {
        console.log('Decrypted file written to disk!');

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