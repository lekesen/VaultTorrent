const directoryList = document.getElementById('list');
const reloadUiButton = document.getElementById('reloadUiBtn');
const uploadButton = document.getElementById('uploadBtn');
const downloadButton = document.getElementById('downloadBtn');

window.electronAPI.getDirectoryList();

window.electronAPI.serveDirectoryList((event, files) => {
    var html = '<ul>';
    files.forEach((file) => {
        html += '<li>' + file+ '</li>';
    });
    html += '</ul>';

    directoryList.innerHTML = html;
});

reloadUiButton.addEventListener('click', () => {
    window.electronAPI.getDirectoryList();
});

uploadButton.addEventListener('click', () => {
    window.electronAPI.clickUpload();
});

downloadButton.addEventListener('click', () => {
    window.electronAPI.clickDownload();
});

