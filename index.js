const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const journal = require('./src/journal');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true
    });

    win.loadFile('index.html');
};

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('request-data', function(event) {
    const data = journal('Journal.220123213548.01.log');
    event.returnValue = data;
});
