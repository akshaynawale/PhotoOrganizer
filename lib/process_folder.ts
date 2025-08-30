import { dialog } from "electron";
import { promises as fs , Dirent } from 'fs';
import path from 'path';
import { ChannelLogger } from "./channel_logger";


export class MediaFilesHandler {
    private imageExtensions: Set<string>;
    private videoExtensions: Set<string>;
    private logger: ChannelLogger;


    constructor(channel_logger: ChannelLogger) {
        this.imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"]);
        this.videoExtensions = new Set([".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"]);
        this.logger = channel_logger;
    }

    isImage(fileName: string): boolean {
        return this.imageExtensions.has(path.extname(fileName).toLowerCase());
    }

    isVideo(fileName: string): boolean {
        return this.videoExtensions.has(path.extname(fileName).toLowerCase());
    }

    pAllFiles(files: Dirent[]) {
        const images: string[] = [];
        const videos: string[] = [];

        for (const file of files) {
            if (file.isFile()) {
                if (this.isImage(file.name)) {
                    images.push(file.name);
                } else if (this.isVideo(file.name)) {
                    videos.push(file.name);
                }
            }
        }
        this.logger.info("total images: "+ images.length);
        this.logger.info("total videos: "+ videos.length);
        this.logger.info("video files: " + videos);
        this.logger.info("image files: " + images);
    }

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
                const files = await fs.readdir(folderPath, { withFileTypes: true });
                console.log("Files in the folder:");
                this.pAllFiles(files);
            } catch (err) {
                console.error('Error reading folder:', err);
            }
            return folderPath;
        } 
    }


}


/**
 * handleFolderOpen function is called when the dialog:openDirectory is send from the renderer
 * this function runs on the server
 */
export async function handleFolderOpen() {
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
            const files = await fs.readdir(folderPath, { withFileTypes: true });
            console.log("Files in the folder:");
            //processFiles(files);
        } catch (err) {
            console.error('Error reading folder:', err);
        }
        return folderPath;
    }
}
/*

function isImageFromFileName(name: string): boolean {
    const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"];
    return IMAGE_EXTENSIONS.includes(path.extname(name).toLowerCase())
}
function isVideoFromFileName(name: string): boolean {
    const VIDEO_EXTENSIONS = [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"];
    return VIDEO_EXTENSIONS.includes(path.extname(name).toLowerCase())
}

function processFiles(files: Dirent[]) {

    const img_files = files.filter(entry => entry.isFile()).filter(
        entry => isImageFromFileName(entry.name)
    ).map(entry => entry.name);
    const video_files = files.filter(entry => entry.isFile()).filter(
        entry => isVideoFromFileName(entry.name)
    ).map(entry => entry.name);
    
    console.log("total images: "+ img_files.length);
    console.log("total videos: "+ video_files.length);
    console.log("video files: " + video_files);
    console.log("image files: " + img_files);
    
} 
*/