const directoryList = document.getElementById('list');
const reloadUiButton = document.getElementById('reloadUiBtn');
const uploadButton = document.getElementById('uploadBtn');
const downloadButton = document.getElementById('downloadBtn');
const logoutButton = document.getElementById('logoutBtn');

window.electronAPI.getDirectoryList();

window.electronAPI.serveDirectoryList((event, files) => {
    var html = '<ul>';
    files.forEach((file) => {
        html += '<li><button id="' + file + '"">'+ file + '</button></li>';
    });
    html += '</ul>';
    directoryList.innerHTML = html;

    files.forEach((file) => {
        document.getElementById(file).addEventListener('click', (e) => {
            console.log(e.target.id);
            window.electronAPI.clickDirectory(e.target.id);
        });
    });
});

reloadUiButton.addEventListener('click', () => {
    //  directoryList.innerHTML = "<p>HELLO WORLD</p>";
    window.electronAPI.getDirectoryList();
});

uploadButton.addEventListener('click', () => {
    window.electronAPI.clickUpload();
});

downloadButton.addEventListener('click', () => {
    window.electronAPI.clickDownload();
});

logoutButton.addEventListener('click', () => {
    window.electronAPI.clickLogout();
});

