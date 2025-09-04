import { contextBridge, ipcRenderer } from 'electron';

// expose only the file open dir read block
contextBridge.exposeInMainWorld('electronAPI', {
    // the renderer will call this function which will securely send a message to the main process of electron
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    // handleLogMessage just receives the message onthe ipcRenderer on the 
    // send-to-frontend-channel and calls the callback function
    handleLogMessage: (callback: (msg: { message: string, level: string }) => void) => {
        ipcRenderer.on(
            'send-to-frontend-channel', (_event, msg) => {
                callback(msg);
            }
        );
    },
    showProposal: (callback: (proposal: string) => void) => {
        ipcRenderer.on(
            'proposal-channel', (_event, msg) => {
                callback(msg);
            }
        );
    },
    applyProposal: (proposal: string) => ipcRenderer.send("apply-proposal", proposal),
});