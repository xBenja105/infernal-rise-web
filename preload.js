const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  quit: () => ipcRenderer.send('app-quit'),
  isDesktop: true
});
