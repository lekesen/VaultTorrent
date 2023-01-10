'use strict';

// Load necessary modules
const fs = require('fs');
const path = require('path');

const kdf = require(path.join(__dirname, 'kdf'));
const indexScraper = require(path.join(__dirname, 'webIndexScraper'));
const cipher = require(path.join(__dirname, 'cipher'));
const torrentClient = require(path.join(__dirname, 'torrentClient', 'torrentClient'));

module.exports.login = (email, password, cb) => {
    console.log('Retrieving session keys...');
    getKeys(email, password, (sessionKeys) => {
		console.log('Decrypting vault...');
		const dir = path.join(__dirname, '..', 'files', 'vault');
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		cipher.decrypt(path.join(__dirname, '..', 'files', 'vault'), path.join(__dirname, '..', 'files', 'vault'), sessionKeys.encKey, () => {
			cb();
		});
	});  
};

module.exports.register = (email, password, cb) => {
	console.log('Creating vault...');

	// Create directory
	const dir = path.join(__dirname, '..', 'files', 'vault');
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	fs.open(path.join(dir, 'readme.txt'), 'w', (err, file) => {
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

module.exports.upload = (email, password, cb) => {
	uploadVault(email, password, ()=> { cb() });
};

module.exports.download = (email, password, cb) => {
	downloadVault(email, password, ()=>{ cb() });
};

module.exports.close = (cb) => {
	closeVault(cb);
};

module.exports.listDirectory = (cb) => {
	const directoryPath = path.join(__dirname, '..', 'files', 'vault');
	listDirectory(directoryPath, cb);
};

function getKeys(email, password, cb) {
	kdf.getMasterKey(email, password, (masterKey) => {
		kdf.getSessionKeys(masterKey, (sessionKeys) => {
			cb(sessionKeys);
		});
	});
}

function downloadVault(email, password, cb) {
	getKeys(email, password, (sessionKeys) => {
		torrentClient.stopSeeding(path.join(__dirname, '..', 'files', sessionKeys.authKey.toString('hex')+'.torrent'), ()=> {}); // TODO: change?
		indexScraper.downloadTorrent(sessionKeys.authKey.toString('hex')+'.torrent', ()=> {
			torrentClient.downloadTorrent(path.join(__dirname, '..', 'files', sessionKeys.authKey.toString('hex')+'.torrent'), path.join(__dirname, '..', 'files', 'vault.tar.enc'), () => {
				torrentClient.startSeeding(path.join(__dirname, '..', 'files', sessionKeys.authKey.toString('hex')+'.torrent'), path.join(__dirname, '..', 'files', 'vault.tar.enc'), cb);
			});
			
		});
	});
}

function uploadVault(email, password, cb) {
	console.log('Retrieving session keys...');
	getKeys(email, password, (sessionKeys) => {
		console.log('Stopping seeding...');
		torrentClient.stopSeeding(path.join(__dirname, '..', 'files', sessionKeys.authKey.toString('hex')+'.torrent'), ()=> {}); // TODO: CHANGE? 
		console.log('Encrypting vault...');
		
		cipher.encrypt(path.join(__dirname, '..', 'files', 'vault'), path.join(__dirname, '..', 'files', 'vault'), sessionKeys.encKey, () => {
			console.log('Creating torrent file...');
			torrentClient.createTorrent(path.join(__dirname, '..', 'files', 'vault.tar.enc'), path.join(__dirname, '..', 'files', sessionKeys.authKey.toString('hex')+'.torrent'), () => {
				console.log('Uploading torrent file...');
				indexScraper.uploadTorrent(sessionKeys.authKey.toString('hex') + '.torrent', () => {
					console.log('Starting seeding');
					torrentClient.startSeeding(path.join(__dirname, '..', 'files', sessionKeys.authKey.toString('hex')+'.torrent'), path.join(__dirname, '..', 'files', 'vault.tar.enc'), cb);
				});
			});
		});
	});
}

function closeVault(cb) {
	// TODO: stop seeding
	fs.rmSync(path.join(__dirname, '..', 'files', 'vault'), { recursive: true, force: true }, (err) => {
		if(err) {
			console.log(err);
		}
	});
	
	fs.unlink(path.join(__dirname, '..', 'files', 'vault.tar'), (err) => {
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