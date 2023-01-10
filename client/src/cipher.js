'use strict';

// Load necessary modules
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');

// TODO: define in constant file
const algorithm = 'aes-256-cbc';
// TODO: IV in 
const iv = Buffer.from('14189dc35ae35e75ff31d7502e245cd9', 'hex');

module.exports.encrypt = (folderPath, outputPath, key, cb) => {
    // Convert folder to .tgz
    exec('tar -czvf ' + outputPath + '.tar -C ' + folderPath + ' .', (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
        if (stderr) {
            console.log(stderr);
        }

        // Encrypt
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const input = fs.createReadStream(outputPath+'.tar');
        const output = fs.createWriteStream(outputPath+'.tar.enc');
        
        input.pipe(cipher).pipe(output);
        
        output.on('finish', function() {
            console.log('Encrypted file written to disk!');
            cb();
        });
        // Remove folder
    });
};

module.exports.decrypt = (inputPath, folderPath, key, cb) => {
    // Decrypt
    const cipher = crypto.createDecipheriv(algorithm, key, iv);
    const input = fs.createReadStream(inputPath+'.tar.enc');
    const output = fs.createWriteStream(inputPath+'.tar');
    
    input.pipe(cipher).pipe(output);
    
    output.on('finish', function() {
        console.log('Decrypted file written to disk!');

        exec('tar -xvf ' + inputPath + '.tar -C ' + folderPath, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }
            if (stderr) {
                console.log(stderr);
            }

            cb({})
        });

        // Decompress .tgz
        /*
        tar.extract( { file: inputPath } ).then((err) => {
            if(err) console.log(err)
            console.log('finished decompression');
            cb();
        });*/
    });
};