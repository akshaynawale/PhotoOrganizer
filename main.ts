import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { ChannelLogger } from "./lib/channel_logger";
import { MediaFilesHandler } from "./lib/process_folder";



/**
 * PhotoOrganizer is responsible for starting the app
 */
class PhotoOrganizer {
    app: Electron.App;
    private readonly logger_channel: string;

    constructor(app: Electron.App) {
        this.app = app;
        this.logger_channel = "send-to-frontend-channel";
    }

    /**
     * creates main window for the application and returns it
     */
    create_browser_window(): BrowserWindow {
        let window = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                // attach the preload script to the renderer process
                preload: path.join(__dirname, "preload.js")
            }
        });
        // initialize the channel logger
        window.loadFile("renderer/index.html");
        return window
    }

    /** 
     * @param window Broswer Window to create the channel logger for
     * @returns ChannelLogger instance for the broswer window 
     */
    create_logger(window: BrowserWindow): ChannelLogger {
        return new ChannelLogger(window, this.logger_channel);
    }

    /**
     * start method creates the window, logger and starts the app
     */
    start(): void {
        this.app.disableHardwareAcceleration();

        this.app.whenReady().then(() => {
            // Set up a Handler for the 'dialog:openDirectory' message

            console.log("app is ready so creating window");
            let window = this.create_browser_window();
            let logger = this.create_logger(window);

            const mediaFilesHandler = new MediaFilesHandler(logger, window);
            ipcMain.handle('dialog:openDirectory', mediaFilesHandler.handleFolderOpen);
        })
    }

}


let photoApp = new PhotoOrganizer(app);
photoApp.start();
