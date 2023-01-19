'use strict';

const path = require('path');
const Buffer = require('buffer').Buffer;

module.exports = Object.freeze({
    // Client network config
    CLIENT_IP: '192.168.1.45',
    CLIENT_PORT: 6881,

    // BitTorrent index config
    INDEX_IP: 'localhost',
    INDEX_PORT: 4000,
    INDEX_UPLOAD_PATH: '/uploadFile',
    INDEX_DOWNLOAD_PATH: '/download',

    // Tracker config
    TRACKER_IP: 'localhost',
    TRACKER_PORT: 8080,

    // Encryption config
    ENC_ALG: 'aes-256-cbc',
    ENC_IV: Buffer.from('14189dc35ae35e75ff31d7502e245cd9', 'hex'),
    MASTER_KDF_SALT: Buffer.from('91c51b47bc8cb82010308fe58985243f', 'hex'),
    ENC_KDF_SALT: Buffer.from('118a3e96c559b5603ff751ab55127f5b', 'hex'),
    AUTH_KDF_SALT: Buffer.from('7bc8cbc35ae3547bc8cb5603ffff7ff7', 'hex'),
    
    // File directories
    VAULT_DIRECTORY: path.join(__dirname, '..', 'files', 'vault'),
    COMPRESSED_VAULT_DIRECTORY: path.join(__dirname, '..', 'files', 'vault.tar'),
    ENCRYPTED_VAULT_DIRECTORY: path.join(__dirname, '..', 'files', 'vault.tar.enc'),
    TORRENT_DIRECTORY: path.join(__dirname, '..', 'files'),

    // Code diretories
    CIPHER: path.join(__dirname, 'cipher'),
    CLIENT: path.join(__dirname, 'client'),
    KDF: path.join(__dirname, 'kdf'),
    INDEX_SCRAPER: path.join(__dirname, 'torrentIndexScraper'),

    TORRENT_CLIENT: path.join(__dirname, 'torrentClient', 'torrentClient'),
    CREATE_TORRENT: path.join(__dirname, 'torrentClient', 'create', 'createTorrent'),
    LEECH_TORRENT: path.join(__dirname, 'torrentClient', 'download', 'download'),
    SEED_TORRENT: path.join(__dirname, 'torrentClient', 'seed', 'seed'),
    TRACKER_CLIENT: path.join(__dirname, 'torrentClient', 'tracker', 'trackerClient'),
    UDP_TRACKER_CLIENT: path.join(__dirname, 'torrentClient', 'tracker', 'udpTracker'),
    HTTP_TRACKER_CLIENT: path.join(__dirname, 'torrentClient', 'tracker', 'httpTracker'),

    MESSAGE: path.join(__dirname, 'torrentClient', 'util', 'message'),
    PIECES: path.join(__dirname, 'torrentClient', 'util', 'Pieces'),
    QUEUE: path.join(__dirname, 'torrentClient', 'util', 'Queue'),
    TORRENT_PARSER: path.join(__dirname, 'torrentClient', 'util', 'torrentParser'),
    UTIL: path.join(__dirname, 'torrentClient', 'util', 'util'),

    // UI
    INDEX_SCREEN: path.join(__dirname, '..', 'ui', 'index', 'index.html'),
    REGISTER_SCREEN: path.join(__dirname, '..', 'ui', 'register', 'register.html'),
    LOADER_SCREEN: path.join(__dirname, '..', 'ui', 'loader', 'loader.html'),
    DIRECTORY_SCREEN: path.join(__dirname, '..', 'ui', 'listDirectory', 'listDirectory.html'),
    UPLOAD_POPUP: path.join(__dirname, '..', 'ui', 'uploadLogin', 'uploadLogin.html'),
    DOWNLOAD_POPUP: path.join(__dirname, '..', 'ui', 'downloadLogin', 'downloadLogin.html'),
    UI_PRELOAD: path.join(__dirname, '..', 'ui','preload.js'),

});