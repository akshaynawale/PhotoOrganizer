import { contextBridge, ipcRenderer } from 'electron';

// expose only the file open dir read block
contextBridge.exposeInMainWorld('electronAPI', {
    // the renderer will call this function which will securely send a message to the main process of electron
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory')
});