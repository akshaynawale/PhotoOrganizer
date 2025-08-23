import { app, BrowserWindow } from "electron";

let createWindow = () => {
    const Bwin = new BrowserWindow({
        width: 800,
        height: 600,
    });

    Bwin.loadFile("index.html");
}

// disabling hardware accerlation so we dont get warning like below
// GetVSyncParametersIfAvailable() failed for 1 times
app.disableHardwareAcceleration();

app.whenReady().then(() => {
    console.log("app is ready so creating window");
    createWindow();
})