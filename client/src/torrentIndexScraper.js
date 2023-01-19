'use strict';

// Load necessary modules
// Modules to interact with website
const axios = require('axios');
const qs = require('qs');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const consts = require(path.join(__dirname, 'constants'));

// Upload torrent file to BitTorrent Index
module.exports.uploadTorrent = (torrentPath, cb) => {
    // Get file to upload
    let formData = new FormData();
    const fileStream = fs.createReadStream(torrentPath);
    formData.append("uploadedFile", fileStream, path.basename(torrentPath));

    // Upload file
    axios.post('http://'+consts.INDEX_IP+':'+consts.INDEX_PORT+consts.INDEX_UPLOAD_PATH, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
    })
    .then((res) => {
        cb();
    }).catch((err) => {
        console.error(err);
    });
};

// Download file from BitTorrent index
module.exports.downloadTorrent = (torrentPath, cb) => {
    downloadFile(torrentPath, cb);
};

async function downloadFile(filePath, cb) {
	// Prepare request
    const form = {
		downloadFile: path.basename(filePath)
	};
	const response = await axios.post('http://'+consts.INDEX_IP+':'+consts.INDEX_PORT+consts.INDEX_DOWNLOAD_PATH, qs.stringify(form), {responseType: 'stream'});
    
    // Write response to disk
    const writeStream = fs.createWriteStream(filePath);
	response.data.pipe(writeStream);   

    writeStream.on('close', () => { cb() });
}
