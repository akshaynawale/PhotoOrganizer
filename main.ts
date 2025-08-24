import { app, BrowserWindow, ipcMain, dialog} from "electron";
import path from "path";
import log from "electron-log";



async function handleFolderOpen() {
    console.log("inside handle Open funciton"); 
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (canceled || filePaths.length === 0) {
        console.log('User cancelled folder selection');
        return null;
    } else {
        console.log(`Selected folder: ${filePaths[0]}`);
        return filePaths[0];
    }
}

let win: BrowserWindow | null = null;

let logAndSend = (msg: string) => {
    log.info(msg);
    if (win) {
        console.log("now sending the message to the frontend");
        win.webContents.send('send-to-frontend-channel', {message: msg, level: 'info'});
    }

}


let createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // attach the preload script to the renderer process
            preload: path.join(__dirname, "preload.js")
            // By removing nodeIntegration, you are making your app much more secure.
            // contextIsolation will default to `true`, which is the recommended setting.
        }
    });

    win.loadFile("index.html");


    // send message on the channel only when the window is ready  i.e finished loading
    win.webContents.on('did-finish-load', () => {
        logAndSend("this is a message send on a channel")
    })
}
if (log.transports.rendererConsole) {
    // this will allow electron-log to send all the logs to the renderer i.e. the frontend
    log.transports.rendererConsole.level = 'silly';
}

// disabling hardware accerlation so we dont get warning like below
// GetVSyncParametersIfAvailable() failed for 1 times
app.disableHardwareAcceleration();


app.whenReady().then(() => {
    // Set up a Handler for the 'dialog:openDirectory' message
    ipcMain.handle('dialog:openDirectory', handleFolderOpen);

    console.log("app is ready so creating window");

    createWindow();

})

