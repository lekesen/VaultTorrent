'use strict';

// Load necessary modules
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');

const client = require(path.join(__dirname, 'src', 'client'));


function createWindow () {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'ui','preload.js')
    }
  });

  let loginWindow;

  ipcMain.on('click-login', (event, email, password) => {
    mainWindow.loadFile(path.join(__dirname, 'ui', 'loader', 'loader.html'));
    client.login(email, password, () => {
      mainWindow.loadFile(path.join(__dirname, 'ui', 'listDirectory', 'listDirectory.html'));
    });
  });

  ipcMain.on('click-register', (event) => {
    mainWindow.loadFile(path.join(__dirname, 'ui', 'register', 'register.html'));
  });

  ipcMain.on('submit-register', (event, email, password) => {
    mainWindow.loadFile(path.join(__dirname, 'ui', 'loader', 'loader.html'));
    client.register(email, password, () => {
      mainWindow.loadFile(path.join(__dirname, 'ui', 'listDirectory', 'listDirectory.html'));
    });
  });

  ipcMain.on('get-directory-list', (event) => {
    const files = client.listDirectory((files) => {
      mainWindow.webContents.send('serve-directory-list', files); 
    });
  });

  ipcMain.on('click-upload', (event) => {
    createLoginWindow();
    loginWindow.loadFile(path.join(__dirname, 'ui', 'uploadLogin', 'uploadLogin.html'));
  });

  ipcMain.on('click-login-upload', (event, email, password) => {
    loginWindow.close();
    client.upload(email, password, () => { });
  });

  ipcMain.on('click-download', (event) => {
    createLoginWindow();
    loginWindow.loadFile(path.join(__dirname, 'ui', 'downloadLogin', 'downloadLogin.html'));
  });

  ipcMain.on('click-login-download', (event, email, password) => {
    loginWindow.close();
    client.download(email, password, () => { });
  });

  ipcMain.on('click-logout', (event, email, password) => {
    mainWindow.loadFile(path.join(__dirname, 'ui', 'index', 'index.html'));
    client.close(() => {});
  });

  ipcMain.on('click-directory', (event, filename) => {
    client.openFile(filename);
  });

  function createLoginWindow() {
    if (!loginWindow) {
      loginWindow = new BrowserWindow({
        webPreferences: {
          preload: path.join(__dirname, 'ui','preload.js')
        },
        width: 400,
        height: 400,
        // close with main window
        parent: mainWindow
      });
      // cleanup
      loginWindow.on('closed', () => {
        loginWindow = null;
      });
    }
  }

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index', 'index.html'));
}



app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  client.close(() => {});
  if (process.platform !== 'darwin') app.quit();
});