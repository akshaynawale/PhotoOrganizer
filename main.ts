import { app, BrowserWindow, ipcMain, dialog} from "electron";
import path from "path";
import { logAndSend } from "./channel_logger";
import { handleFolderOpen } from "./process_folder";

let win: BrowserWindow | null = null;

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
        logAndSend(win, "this is a message send on a channel");
    })
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

