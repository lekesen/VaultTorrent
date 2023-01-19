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

// Login function
module.exports.login = (email, password, cb) => {
	console.log('Logging in...');
    
	if (fs.existsSync(consts.ENCRYPTED_VAULT_DIRECTORY)) {
		// Retrieve keys from email and password
		console.log('Retrieving session keys...');
		getKeys(email, password, (sessionKeys) => {
			// If vault exists --> decrypt vault and start seeding
			console.log('Decrypting vault...');
			cipher.decrypt(consts.VAULT_DIRECTORY, consts.COMPRESSED_VAULT_DIRECTORY, consts.ENCRYPTED_VAULT_DIRECTORY,sessionKeys.encKey, () => { cb(console.log('Vault decrypted!')); });
			console.log('Seeding...');
			torrentClient.startSeeding(getTorrentDirectory(sessionKeys.authKey.toString('hex')+'.torrent'), consts.ENCRYPTED_VAULT_DIRECTORY);
		});  
	}else {
		// If vault doesn't exist --> download vault from index website
		downloadVault(email, password, cb);
	}
	
};

// Register function
module.exports.register = (email, password, cb) => {
	console.log('Registering...');
	
	// Create vault directory
	console.log('Creating vault...');
	if (!fs.existsSync(consts.VAULT_DIRECTORY)) {
		fs.mkdirSync(consts.VAULT_DIRECTORY);
	}
	// Create readme file
	fs.open(path.join(consts.VAULT_DIRECTORY, 'readme.txt'), 'w', (err, file) => {
		if (err) {
		  console.log(err);
		  return;
		}
		fs.writeFile(file, 'Hello world!', function (err) {
			if (err) {
				console.log(err);
			}
			// After creating the vault, upload it.
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

// Get files from directory
module.exports.listDirectory = (cb) => {
	listDirectory(consts.VAULT_DIRECTORY, cb);
};

// Open file from vault
module.exports.openFile = (fileName) => {
	console.log('Opening file ' + fileName);
	exec('open '+ path.join(consts.VAULT_DIRECTORY, fileName), (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }
        if (stderr) {
            console.log(stderr);
        };
    });
}

// Function to download vault
function downloadVault(email, password, cb) {
	console.log('Downloading Vault...')

	// Get session keys
	console.log('Retrieving session keys...')
	getKeys(email, password, (sessionKeys) => {
		const torrentFile = getTorrentDirectory(sessionKeys.authKey.toString('hex')+'.torrent');
		torrentClient.stopSeeding(()=> {});
		// Download torrent file
		console.log('Downloading torrent file...');
		indexScraper.downloadTorrent(torrentFile, ()=> {
			// Download vault
			console.log('Downloading vault...');
			torrentClient.downloadTorrent(torrentFile, consts.ENCRYPTED_VAULT_DIRECTORY, () => {
				// Decrypt vault
				console.log('Decrypting vault...');
				if (!fs.existsSync(consts.VAULT_DIRECTORY)) {
					fs.mkdirSync(consts.VAULT_DIRECTORY);
				}
				cipher.decrypt(consts.VAULT_DIRECTORY, consts.COMPRESSED_VAULT_DIRECTORY, consts.ENCRYPTED_VAULT_DIRECTORY,sessionKeys.encKey, () => {
					// Start seeding
					console.log('Vault download has finished!');
					console.log('Seeding...');
					torrentClient.startSeeding(torrentFile, consts.ENCRYPTED_VAULT_DIRECTORY);
					cb();
				});
			});
			
		});
	});
}
// Function to upload vault
function uploadVault(email, password, cb) {
	console.log('Uploading Vault...');

	// Get session keys
	console.log('Retrieving session keys...');
	getKeys(email, password, (sessionKeys) => {
		const torrentFile = getTorrentDirectory(sessionKeys.authKey.toString('hex')+'.torrent');
		torrentClient.stopSeeding(()=> {}); // TODO: CHANGE? 
		
		// Encrypt vault
		console.log('Encrypting vault...');
		cipher.encrypt(consts.VAULT_DIRECTORY, consts.COMPRESSED_VAULT_DIRECTORY, consts.ENCRYPTED_VAULT_DIRECTORY, sessionKeys.encKey, () => {
			// Create torrent file
			console.log('Creating torrent file...');
			torrentClient.createTorrent(consts.ENCRYPTED_VAULT_DIRECTORY, torrentFile, () => {
				// Upload torrent file
				console.log('Uploading torrent file...');
				indexScraper.uploadTorrent(torrentFile, () => {
					// Start seeding
					console.log('Vault upload has finished!');
					console.log('Seeding...');
					torrentClient.startSeeding(torrentFile, consts.ENCRYPTED_VAULT_DIRECTORY);
					cb();
				});
			});
		});
	});
}

// Function to close vault (erase unprotected files)
function closeVault(cb) {
	// TODO: stop seeding

	// Remove vault directory and compressed directory
	console.log('Closing vault...');
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

	console.log('Vault closed!');
}

// Function to retrieve session keys from email/password
function getKeys(email, password, cb) {
	// Get master key
	kdf.getMasterKey(email, password, (masterKey) => {
		// Get session keys
		kdf.getSessionKeys(masterKey, (sessionKeys) => {
			// Return keys
			cb(sessionKeys);
		});
	});
}

// Function to retrieve files from vault
function listDirectory(directoryPath, cb) {
	fs.readdir(directoryPath, function (err, files) {
		if (err) {
			console.log(err);
		} 
		cb(files);
	});
}

// Function to retrieve torrent directory
function getTorrentDirectory(torrentName) {
	return path.join(consts.TORRENT_DIRECTORY, torrentName);
}