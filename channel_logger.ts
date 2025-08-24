import { BrowserWindow } from "electron";
import log from "electron-log";


/**
 * ChannelLogger can be used to log messages on console as well as it sends the log messages on
 * the IPC Channel
 */
export class ChannelLogger {
    window: BrowserWindow;
    channel: string;

    /**
     * 
     * @param window -  Browser window create by the main server
     * @param channel - IPC channel to which logger should send the log messages
     */
    constructor(window: BrowserWindow, channel: string) {
        this.window = window;
        this.channel = channel;
    }

    info(msg: string): void {
        console.info(msg);
        this.window.webContents.send('send-to-frontend-channel', {message: msg, level: "info"});
    }

    debug(msg: string): void {
        console.debug(msg);
        this.window.webContents.send('send-to-frontend-channel', {message: msg, level: "debug"});
    }
   
}