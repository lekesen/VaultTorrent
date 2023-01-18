'use strict';

// Load necessary modules
// Modules to interact with website
const axios = require('axios');
const qs = require('qs');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const consts = require(path.join(__dirname, 'constants'));


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
        console.log('Uploaded file succesfully.');
        cb();
    }).catch((err) => {
        console.error(err);
    });
};

module.exports.downloadTorrent = (torrentPath, cb) => {
    downloadFile(torrentPath, cb);
};

async function downloadFile(filePath, cb) {
	const writeStream = fs.createWriteStream(filePath);

    const form = {
		downloadFile: path.basename(filePath)
	};

	const response = await axios.post('http://'+consts.INDEX_IP+':'+consts.INDEX_PORT+consts.INDEX_DOWNLOAD_PATH, qs.stringify(form), {responseType: 'stream'});

	response.data.pipe(writeStream);   

    writeStream.on('close', () => { cb() });
}
