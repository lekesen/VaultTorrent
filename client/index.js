'use strict';

// Load necessary modules
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');

const consts = require(path.join(__dirname, 'src', 'constants'));
const client = require(consts.CLIENT);


// Function to create window and set up 
function createWindow () {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: consts.UI_PRELOAD
    }
  });

  // Pop-up to upload/download torrent from index
  let loginWindow;

  // Set up listeners
  // Login
  ipcMain.on('click-login', (event, email, password) => {
    mainWindow.loadFile(consts.LOADER_SCREEN);
    client.login(email, password, () => {
      mainWindow.loadFile(consts.DIRECTORY_SCREEN);
    });
  });

  // Load register screen
  ipcMain.on('click-register', (event) => {
    mainWindow.loadFile(consts.REGISTER_SCREEN);
  });

  // End registration
  ipcMain.on('submit-register', (event, email, password) => {
    mainWindow.loadFile(consts.LOADER_SCREEN);
    client.register(email, password, () => {
      mainWindow.loadFile(consts.DIRECTORY_SCREEN);
    });
  });

  // List vault directory
  ipcMain.on('get-directory-list', (event) => {
    const files = client.listDirectory((files) => {
      mainWindow.webContents.send('serve-directory-list', files); 
    });
  });

  // Upload vault
  ipcMain.on('click-upload', (event) => {
    createLoginWindow();
    loginWindow.loadFile(consts.UPLOAD_POPUP);
  })
  ipcMain.on('click-login-upload', (event, email, password) => {
    loginWindow.close();
    client.upload(email, password, () => { });
  });

  // Download vault
  ipcMain.on('click-download', (event) => {
    createLoginWindow();
    loginWindow.loadFile(consts.DOWNLOAD_POPUP);
  });
  ipcMain.on('click-login-download', (event, email, password) => {
    loginWindow.close();
    client.download(email, password, () => { });
  });

  // Logout
  ipcMain.on('click-logout', (event, email, password) => {
    mainWindow.loadFile(consts.INDEX_SCREEN);
    client.close(() => {});
  });

  // Open file
  ipcMain.on('click-directory', (event, filename) => {
    client.openFile(filename);
  });

  // Create pop-up window
  function createLoginWindow() {
    if (!loginWindow) {
      loginWindow = new BrowserWindow({
        webPreferences: {
          preload: consts.UI_PRELOAD
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

  mainWindow.loadFile(consts.INDEX_SCREEN);
}


// When initial set-up has finished, run the application
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