import { dialog } from "electron";
import * as fs from 'fs';
import path from 'path';
import { ChannelLogger } from "./channel_logger";
import { BrowserWindow } from "electron";
import { ByYearGrouper, FileSegregator } from "./file_segregator";


export class MediaFilesHandler {
    private imageExtensions: Set<string>;
    private videoExtensions: Set<string>;
    private logger: ChannelLogger;
    private window: BrowserWindow;

    constructor(channel_logger: ChannelLogger, window: BrowserWindow) {
        this.imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"]);
        this.videoExtensions = new Set([".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"]);
        this.logger = channel_logger;
        this.window = window
    }

    isImage(fileName: string): boolean {
        return this.imageExtensions.has(path.extname(fileName).toLowerCase());
    }

    isVideo(fileName: string): boolean {
        return this.videoExtensions.has(path.extname(fileName).toLowerCase());
    }

    processFolderFiles(files: fs.Dirent[]) {
        const images: fs.Dirent[] = [];
        const videos: fs.Dirent[] = [];

        for (const file of files) {
            if (file.isFile()) {
                if (this.isImage(file.name)) {
                    images.push(file);
                } else if (this.isVideo(file.name)) {
                    videos.push(file);
                }
            }
        }
        this.logger.info("total images: " + images.length);
        this.logger.info("total videos: " + videos.length);
        this.logger.info("video files: " + videos.map(f => f.name).join(", "));
        this.logger.info("image files: " + images.map(f => f.name).join(", "));


        let groupedFiles = new FileSegregator(videos, images).segregateFiles(new ByYearGrouper());
        groupedFiles.then((files) => {
            console.log("serialized files: " + files.serialize());
            this.window.webContents.send('proposal-channel', files.serialize());
        });
    }

    /**
     * handleFolderOpen function is called when the dialog:openDirectory is send from the renderer
     * this function runs on the server
     */
    handleFolderOpen = async () => {
        console.log("inside handle Open funciton");
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (canceled || filePaths.length === 0) {
            console.log('User cancelled folder selection');
            return null;
        } else {
            const folderPath = filePaths[0];
            console.log(`Selected folder: ${folderPath}`);

            try {
                const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
                console.log("Files in the folder:");
                this.processFolderFiles(files);
            } catch (err) {
                console.error('Error reading folder:', err);
            }
            return folderPath;
        }
    }


}

