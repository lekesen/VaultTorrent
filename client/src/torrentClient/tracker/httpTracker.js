'use strict';

// Load necessary modules
const http = require('http');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const bencode = require('bencode');
const path = require('path');

const consts = require(path.join(__dirname, '..', '..', 'constants'));
const tp = require(consts.TORRENT_PARSER);
const util = require(consts.UTIL);


// Get peers from tracker
module.exports.getPeers = (trackerUrl, torrent, cb) => {
    getTrackerInfo(trackerUrl, torrent, false, (trackerInfo) => {
        if (trackerInfo) {
            cb(trackerInfo.peers);
        }
    });
};

// Notify tracker we are seeding
module.exports.notifySeeding = (trackerUrl, torrent, cb) => {
    getTrackerInfo(trackerUrl, torrent, true, (trackerInfo) => {
        cb(trackerInfo);
    });
};


function getTrackerInfo(trackerUrl, torrent, seeding, cb) {
    const url = urlParse(trackerUrl);

	let parameters;
	if (!seeding) {
		parameters = {
			info_hash: escape(torrentParser.infoHash(torrent).toString('binary')),
			peer_id: escape(util.genId().toString('binary')),
			port: consts.CLIENT_PORT,
			uploaded: 0,
			downloaded: 0,
			left: BigInt('0x' + torrentParser.size(torrent).toString('hex')),
			event: 'started'
		}
	} else {
		parameters = {
			info_hash: escape(torrentParser.infoHash(torrent).toString('binary')),
			peer_id: escape(util.genId().toString('binary')),
			port: consts.CLIENT_PORT,
			uploaded: 0,
			downloaded: 0,
			left: 0,
			event: 'completed'
		}
	
	}
    
    const options = {
		host: url.hostname,
		port: url.port ? url.port : 80,
		path: buildPathFromParams(url.path, parameters),
		method: 'GET',

		headers: {
			'Host': url.hostname,
			'Accept-Encoding': 'gzip',
			'Connection': 'close'
		}
	}

    const req = http.request(options, (res) => {
		res.on('data', (d) => {
			if (res.statusCode == 400) {
				parseResponse(d, cb);
			}
		 });
	});

	req.on('error', (err) => console.log );

	req.end();
}

// Build path without escape function
function buildPathFromParams(pathname, parameters) {
	var path = pathname + '?';
	var first = true;
	for (const [key, value] of Object.entries(parameters)) {
		const parsedKey = key;
		var parsedValue = value;
		if (! first) {
			path += '&';
			
		}
		path += parsedKey + '=' + parsedValue;
		first = false;
	}
	return path;
}

// Parse incoming data
function parseResponse(data, cb) {
	const parsedData = bencode.decode(data);

	if (parsedData.failure_reason) {
		console.log(data.failure_reason);
		cb([]);
		return;
	}
	if (parsedData.warning_message) {
		console.log(data.warning_message);
	}

	const peers = parsedData.peers;
	var peerList = [];

	function group(iterable, groupSize) {
		let groups = [];
		for (let i = 0; i < iterable.length; i += groupSize) {
			groups.push(iterable.slice(i, i + groupSize));
		}
		return groups;
	}

	if (Buffer.isBuffer(peers)) {
		peerList = group(peers, 6).map(address => {
	      return {
	        ip: address.slice(0, 4).join('.'),
	        port: address.readUInt16BE(4)
	      }
	    });
	} else {
		//TODO: implement reading from dictionary
	}
	
    var trackerInfo = {
        peers: peerList,
        interval: parsedData.interval
    }

	cb(trackerInfo);
}