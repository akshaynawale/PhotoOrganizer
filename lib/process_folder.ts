import { dialog } from "electron";
import * as fs from 'fs';
import path from 'path';
import { ChannelLogger } from "./channel_logger";
import { BrowserWindow } from "electron";
import { group } from "console";

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
        let groupedImages = new FileSegregator(images).segregateFiles(new ByYearGrouper());
        groupedImages.then((images) => {
            this.window.webContents.send('proposal-channel', new GroupedFiles(images).serialize());
        });
        let groupedVideos = new FileSegregator(videos).segregateFiles(new ByYearGrouper());
        groupedVideos.then((videos) => {
            this.window.webContents.send('proposal-channel', new GroupedFiles(videos).serialize());
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


/**
 * FileGrouper Interface to get Group key
 */
interface FileGrouper {

    getKey(file: fs.Dirent): Promise<string>;

}

/**
 * ByYearGrouper is used to group files with create date year
 */
export class ByYearGrouper {

    async getKey(file: fs.Dirent): Promise<string> {
        const file_path = path.join(file.parentPath, file.name);

        let fstat = await fs.promises.stat(file_path);
        return fstat.ctime.getFullYear().toString();
    }
}

export class GroupedFiles {
    private groupedFiles: { [key: string]: fs.Dirent[] };

    constructor(groupedFiles: { [key: string]: fs.Dirent[] }) {
        this.groupedFiles = groupedFiles;
    }

    serialize(): string {
        let to_serialize: { [key: string]: string[] } = {};

        for (let k in this.groupedFiles) {
            to_serialize[k] = this.groupedFiles[k].map(f => f.name);
        };
        return JSON.stringify(to_serialize);
    };
}

/**
 * FileSegregator is used to segregate a files with a grouper strategy
 */
export class FileSegregator {

    files: fs.Dirent[];

    constructor(files: fs.Dirent[]) {
        this.files = files;

    }

    async segregateFiles(strategy: FileGrouper): Promise<{ [key: string]: fs.Dirent[] }> {
        let groupedFiles: { [key: string]: fs.Dirent[] } = {};

        // getting all the keys parallely(or actually asynchronously) with Promises.all
        let keys = await Promise.all(this.files.map((f) => strategy.getKey(f)))

        this.files.forEach((f, i) => {
            let key = keys[i];
            if (!groupedFiles[key]) {
                groupedFiles[key] = [];
            }
            groupedFiles[key].push(f);
        });

        return groupedFiles
    }
}