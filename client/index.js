'use strict';


const tracker = require('./src/trackerClient/trackerClient');
const download = require('./src/download/download');
const create = require('./src/createTorrent/createTorrent');
const seed = require('./src/seed/seed');
const tp = require('./src/util/torrentParser');

const file_name = './files/torrents/big-buck-bunny.torrent';
const torrent = tp.open(file_name);
const download_path = './files/downloads/';

//seed.startSeeding(torrent, download_path);

//create.createTorrent('./files/downloads/tgk.jpg');

download(torrent, download_path);


/*
const { app, BrowserWindow } = require('electron');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile('./ui/index.html');
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});*/