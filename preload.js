const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
    onMenuImport: (callback) => ipcRenderer.on('menu-import', callback)
});
