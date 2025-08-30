import { app, BrowserWindow, ipcMain, dialog} from "electron";
import path from "path";
import { ChannelLogger } from "./lib/channel_logger";
import { handleFolderOpen, MediaFilesHandler } from "./lib/process_folder";


/**
 * PhotoOrganizer is the main class which is responsible to create the browser window 
 * and loads the index.html file
 */
class PhotoOrganizer {
    private window!: BrowserWindow;
    logger!: ChannelLogger;
    private readonly logger_channel: string;
    
    constructor() {
        this.logger_channel = "send-to-frontend-channel";
    }

    /**
     * init method is called to initialize the PhotoOrganizer by creating a BrowserWindow 
     * instance  
     */
    init(): void {
        let window = new BrowserWindow({
            width: 800,
            height: 600, 
            webPreferences: {
                // attach the preload script to the renderer process
                preload: path.join(__dirname, "preload.js")
            }
        });
        this.window = window;
        // initialize the channel logger
        this.logger = new ChannelLogger(window, this.logger_channel)

        this.window.loadFile("index.html");
        //following log message is just for testing and we need to remove this afterwards
        this.window.webContents.on('did-finish-load', () => {
            this.logger.info("this is a message send on a channel")
        })
    }
}


/**
 * StartPhotoOrganizer is responsible for starting the app
 */
class StartPhotoOrganizer {
    app: Electron.App;
    photoOrganizer: PhotoOrganizer;
    

    constructor(app: Electron.App) {
        this.photoOrganizer = new PhotoOrganizer();
        this.app = app;
    }
    
    start(): void {
        this.app.disableHardwareAcceleration();
        
        this.app.whenReady().then(() => {
            // Set up a Handler for the 'dialog:openDirectory' message

            console.log("app is ready so creating window");
            this.photoOrganizer.init();
            const mediaFilesHandler = new MediaFilesHandler(this.photoOrganizer.logger);
            ipcMain.handle('dialog:openDirectory', mediaFilesHandler.handleFolderOpen); 
        })
    }

}


let photoApp = new StartPhotoOrganizer(app);
photoApp.start();
