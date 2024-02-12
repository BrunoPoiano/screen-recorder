const { app, BrowserWindow, ipcMain, desktopCapturer, remote } = require('electron');

const { dialog } = require('electron');
const fs = require('fs')

ipcMain.handle('saveScreenRecorded', async (event, buffer) => {

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'save video',
    defaultPath: `video-${Date.now()}.webm`
  });

  if (filePath) {
    
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('Error saving video:', err);
      } else {
        console.log('Video saved successfully:', filePath);
      }
    });
  }
});

ipcMain.handle('getDesktopSources', async (event, options) => {
  try {
    const sources = await desktopCapturer.getSources(options);
    return sources;
  } catch (error) {
    console.error('Error getting desktop sources:', error);
    return [];
  }
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL('http://localhost:3000');
  mainWindow.webContents.openDevTools()

}
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})