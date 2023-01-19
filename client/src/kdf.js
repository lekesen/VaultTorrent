'use strict';

// Load necessary modules
const crypto = require('crypto');
const path = require('path');
const Buffer = require('buffer').Buffer;

const consts = require(path.join(__dirname, 'constants'));

// Get master key from email and password
module.exports.getMasterKey = (email, password, cb) => {
    // Hash email and password
    const email_hash = crypto.createHash('sha256').update(email).digest();
    const password_hash = crypto.createHash('sha256').update(password).digest();

    // Generate key from kdf, concatenating both hashes
    getKey(Buffer.concat([email_hash, password_hash]), consts.MASTER_KDF_SALT, 64, cb);
};

// Derive session keys from master key
module.exports.getSessionKeys = (masterKey, cb) => {
    getKey(masterKey, consts.AUTH_KDF_SALT, 32, (authenticationKey) => {
        getKey(masterKey, consts.ENC_KDF_SALT, 32, (encryptionKey) => {
            const sessionKeys = {
                authKey: authenticationKey,
                encKey: encryptionKey
            }
            cb(sessionKeys);
        });
    });
};

// FUnction to generate key using scrypt
function getKey(password, salt, length, cb) {
    // N is the cost
    crypto.scrypt(password, salt, length, { N: 2**14 }, (err, derivedKey) => { 
        if (err) {
            console.log(err);
        } else {
            cb(derivedKey);
        }
    });
}