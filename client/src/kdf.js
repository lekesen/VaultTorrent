'use strict';

// Load necessary modules
const crypto = require('crypto');
const buffer = require('buffer').Buffer;

// TODO: create random salt and store safely    
const masterKeySalt = Buffer.from('91c51b47bc8cb82010308fe58985243f', 'hex');
const sessionKeySalt = Buffer.from('118a3e96c559b5603ff751ab55127f5b', 'hex');

// Get master key from email and password
module.exports.getMasterKey = (email, password, cb) => {
    // TODO: use better hash
    const hash = crypto.createHash('md5').update(email+password).digest('hex');

    // Generate key from kdf
    getKey(hash, masterKeySalt, cb);
};

// Derive session keys from master key
module.exports.getSessionKeys = (masterKey, cb) => {
    getKey(masterKey, sessionKeySalt, (derivedKey) => {
        const sessionKeys = {
            authKey: derivedKey.slice(0, 32),
            encKey: derivedKey.slice(32)
        }
        cb(sessionKeys);
    });
};

function getKey(password, salt, cb) {
    // N is the cost
    crypto.scrypt(password, salt, 64, { N: 2**14 }, (err, derivedKey) => { 
        if (err) {
            console.log(err);
        } else {
            cb(derivedKey);
        }
    });
}