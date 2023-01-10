const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    clickLogin: (email, password) => ipcRenderer.send('click-login', email, password),
    clickRegister: () => ipcRenderer.send('click-register'),
    submitRegister: (email, password) => ipcRenderer.send('submit-register', email, password),
    getDirectoryList: () => ipcRenderer.send('get-directory-list'),
    serveDirectoryList: (files) => ipcRenderer.on('serve-directory-list', files),
    clickUpload: () => ipcRenderer.send('click-upload'),
    clickLoginUpload: (email, password) => ipcRenderer.send('click-login-upload', email, password),
    clickDownload: () => ipcRenderer.send('click-download'),
    clickLoginDownload: (email, password) => ipcRenderer.send('click-login-download', email, password),
    clickLogout: () => ipcRenderer.send('click-logout'),
})