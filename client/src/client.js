'use strict';

// Load necessary modules
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const consts = require(path.join(__dirname, 'constants'));
const kdf = require(consts.KDF);
const indexScraper = require(consts.INDEX_SCRAPER);
const cipher = require(consts.CIPHER);
const torrentClient = require(consts.TORRENT_CLIENT);

// Login
module.exports.login = (email, password, cb) => {
    console.log('Retrieving session keys...');
    getKeys(email, password, (sessionKeys) => {
		// If vault exists --> decrypt vault
		if (fs.existsSync(consts.ENCRYPTED_VAULT_DIRECTORY)) {
			console.log('Decrypting vault...');
			cipher.decrypt(consts.VAULT_DIRECTORY, consts.COMPRESSED_VAULT_DIRECTORY, consts.ENCRYPTED_VAULT_DIRECTORY,sessionKeys.encKey, () => { cb(); });
			// Start seeding
			torrentClient.startSeeding(getTorrentDirectory(sessionKeys.authKey.toString('hex')+'.torrent'), consts.ENCRYPTED_VAULT_DIRECTORY);
		} else {
			downloadVault(email, password, cb);
		}
	});  
};

// Register
module.exports.register = (email, password, cb) => {
	console.log('Creating vault...');

	// Create directory
	if (!fs.existsSync(consts.VAULT_DIRECTORY)) {
		fs.mkdirSync(consts.VAULT_DIRECTORY);
	}
	fs.open(path.join(consts.VAULT_DIRECTORY, 'readme.txt'), 'w', (err, file) => {
		if (err) {
		  console.log(err);
		  return;
		}
		fs.writeFile(file, 'Hello world!', function (err) {
			if (err) {
				console.log(err);
			}
			uploadVault(email, password, () => {
				cb();
			});
		});
	});
};

// Upload Vault
module.exports.upload = (email, password, cb) => {
	uploadVault(email, password, ()=> { cb() });
};

// Download Vault
module.exports.download = (email, password, cb) => {
	downloadVault(email, password, ()=>{ cb() });
};

// Close Vault
module.exports.close = (cb) => {
	closeVault(cb);
};

module.exports.listDirectory = (cb) => {
	listDirectory(consts.VAULT_DIRECTORY, cb);
};

module.exports.openFile = (fileName) => {
	exec('open '+ path.join(consts.VAULT_DIRECTORY, fileName), (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
        if (stderr) {
            console.log(stderr);
        };
    });
}

function getKeys(email, password, cb) {
	kdf.getMasterKey(email, password, (masterKey) => {
		kdf.getSessionKeys(masterKey, (sessionKeys) => {
			cb(sessionKeys);
		});
	});
}

function downloadVault(email, password, cb) {
	getKeys(email, password, (sessionKeys) => {
		const torrentFile = getTorrentDirectory(sessionKeys.authKey.toString('hex')+'.torrent');
		torrentClient.stopSeeding(torrentFile, ()=> {}); // TODO: change?
		indexScraper.downloadTorrent(torrentFile, ()=> {
			torrentClient.downloadTorrent(torrentFile, consts.ENCRYPTED_VAULT_DIRECTORY, () => {
				if (!fs.existsSync(consts.VAULT_DIRECTORY)) {
					fs.mkdirSync(consts.VAULT_DIRECTORY);
				}
				cipher.decrypt(consts.VAULT_DIRECTORY, consts.COMPRESSED_VAULT_DIRECTORY, consts.ENCRYPTED_VAULT_DIRECTORY,sessionKeys.encKey, () => {
					torrentClient.startSeeding(torrentFile, consts.ENCRYPTED_VAULT_DIRECTORY);
					cb();
				});
			});
			
		});
	});
}

function uploadVault(email, password, cb) {
	console.log('Retrieving session keys...');
	getKeys(email, password, (sessionKeys) => {
		const torrentFile = getTorrentDirectory(sessionKeys.authKey.toString('hex')+'.torrent');
		console.log('Stopping seeding...');
		torrentClient.stopSeeding(torrentFile, ()=> {}); // TODO: CHANGE? 
		console.log('Encrypting vault...');
		
		cipher.encrypt(consts.VAULT_DIRECTORY, consts.COMPRESSED_VAULT_DIRECTORY, consts.ENCRYPTED_VAULT_DIRECTORY, sessionKeys.encKey, () => {
			console.log('Creating torrent file...');
			torrentClient.createTorrent(consts.ENCRYPTED_VAULT_DIRECTORY, torrentFile, () => {
				console.log('Uploading torrent file...');
				indexScraper.uploadTorrent(torrentFile, () => {
					console.log('Starting seeding');
					torrentClient.startSeeding(torrentFile, consts.ENCRYPTED_VAULT_DIRECTORY);
					cb();
				});
			});
		});
	});
}

function closeVault(cb) {
	// TODO: stop seeding
	fs.rmSync(consts.VAULT_DIRECTORY, { recursive: true, force: true }, (err) => {
		if(err) {
			console.log(err);
		}
	});
	
	fs.unlink(consts.COMPRESSED_VAULT_DIRECTORY, (err) => {
		if(err) {
			console.log(err);
		}
	});
}

function listDirectory(directoryPath, cb) {
	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			console.log(err);
		} 
		cb(files);
	});
}

function getTorrentDirectory(torrentName) {
	return path.join(consts.TORRENT_DIRECTORY, torrentName);
}