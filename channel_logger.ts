import { BrowserWindow } from "electron";
import log from "electron-log";


/**
 * @param window - Browser window create by the main server
 * @param msg - string representing the log message we want to send to channel
 * this function logs the message and sends on a IPC (InterProcessCommunicaiton) channel
 */
export function logAndSend(window: BrowserWindow|null, msg: string): void {

    log.info(msg);
    if (window) {
        console.log(msg);
        window.webContents.send('send-to-frontend-channel', {message: msg, level: 'info'});
    }

}