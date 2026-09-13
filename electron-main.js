const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// Prevent multiple instances of the game running simultaneously
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'build', 'icon.ico')
    : path.join(__dirname, 'build', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    center: true,
    title: 'Infernal Rise 2.0',
    backgroundColor: '#030105',
    icon: iconPath,
    autoHideMenuBar: true,
    useContentSize: true,
    show: false, // Show once ready-to-show to prevent white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false // Keep game running smoothly even if unfocused
    }
  });

  // Remove default top navigation menu for complete immersion
  Menu.setApplicationMenu(null);

  // Load the game entry point
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Smooth appearance when assets and canvas are ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Native Fullscreen toggle with F11 or Alt+Enter
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      // F11 or Alt+Enter for Fullscreen Toggle
      if (input.key === 'F11' || (input.alt && input.key === 'Enter')) {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        event.preventDefault();
      }
      // Ctrl+Shift+I for DevTools (debugging during development)
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    }
  });

  // Prevent navigation to external sites inside the game window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

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
  });
}
