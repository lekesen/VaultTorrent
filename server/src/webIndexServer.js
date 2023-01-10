'use strict';
// https://javascript.plainenglish.io/how-to-implement-a-file-upload-server-with-node-js-83043bc180fc

// Load necessary modules
const path = require('path');
const fs = require('fs');
const express = require('express');
const busboy = require('busboy');
const bodyParser = require('body-parser');

module.exports.startServer = () => {
  const app = express();
  const port = 4000;
  //app.use(bodyParser.json());
  if (process.env.NODE_ENV === 'production') {
    app.use(compression({}));
  }
  app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
  })); 

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/index.html'));
  });

  app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/upload.html'));
  });

  app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/about.html'));
  });

  app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/contact.html'));
  });

  app.post('/uploadFile', (req, res) => {
    let filename = '';
    const bb = busboy({ headers: req.headers });
    // TODO: analyze file
    bb.on('file', (name, file, info) => {
      filename = info.filename;
      console.log('NAME: ' + filename);
      const saveTo = path.join(__dirname, '/../files/'+filename);
      file.pipe(fs.createWriteStream(saveTo));
    });
    bb.on('close', () => {
      res.sendFile(path.join(__dirname, '/../views/uploadSuccess.html'));
    });
    req.pipe(bb);
  });

  app.post('/download', (req, res) => {
    const filename = req.body.downloadFile;
    const file = path.join(__dirname, '/../files/' + filename);

    // TODO: error handling if file does not exist
    res.download(file);
  });

  app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/css/style.css'));
  });

  app.get('/logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, '/../views/images/logo.png'));
  });
};

