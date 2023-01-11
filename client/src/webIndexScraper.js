'use strict';

// Load necessary modules
// Modules to interact with website
const axios = require('axios');
const qs = require('qs');
const FormData = require('form-data');

const fs = require('fs');
const path = require('path');


module.exports.uploadTorrent = (fileName, cb) => {
    // Get file to upload
    let formData = new FormData();
    const fileStream = fs.createReadStream(path.join(__dirname, '..', 'files', fileName));
    formData.append("uploadedFile", fileStream, fileName);

    // Upload file
    axios.post('http://10.0.2.8:4000/uploadFile', formData, {
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

module.exports.downloadTorrent = (fileName, cb) => {
    downloadFile(fileName, cb);
};

async function downloadFile(fileName, cb) {
    const url = 'http://10.0.2.8:4000/download';
	const filePath = path.join(__dirname, '..', 'files', fileName);
	const writeStream = fs.createWriteStream(filePath);

    const form = {
		downloadFile: fileName
	};

	const response = await axios.post('http://10.0.2.8:4000/download', qs.stringify(form), {responseType: 'stream'});

	response.data.pipe(writeStream);   

    writeStream.on('close', () => { cb() });
}
