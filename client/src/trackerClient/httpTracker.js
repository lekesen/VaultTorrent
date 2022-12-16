'use strict';

// Load necessary modules
const http = require('http');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const bencode = require('bencode');

const tp = require('../util/torrentParser');
const util = require('../util/util');
const consts = require('../util/constants');
/*
HTTP Tracker protocol:
	1) Send announce request w/ HTTP.
	4) Get announce response and extract peer list.
*/

// Get peers from tracker
module.exports.getPeers = (trackerUrl, torrent, cb) => {
    getTrackerInfo(trackerUrl, torrent, (trackerInfo) => {
        if (trackerInfo) {
            cb(trackerInfo.peers);
        }
    });
};

// Notify tracker we are seeding
module.exports.notifySeeding = (trackerUrl, torrent, cb) => {
    getTrackerInfo(trackerUrl, torrent, seeding = true, (trackerInfo) => {
        cb(trackerInfo);
    });
};

function getTrackerInfo(trackerUrl, torrent, seeding = false, cb) {
    const url = urlParse(trackerUrl);

    const parameters = {
		info_hash: escape(torrentParser.infoHash(torrent).toString('binary')),
		peer_id: escape(util.genId().toString('binary')),
		port: consts.PORT,
		uploaded: 0,
		downloaded: seeding,
		left: BigInt('0x' + torrentParser.size(torrent).toString('hex')),
		event: 'started'
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
			path += '&'
			
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

	// TODO: get interval and report periodically
	// TODO: get tracker_id for future reports

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