import { dialog } from "electron";
import * as fs from 'fs';
import path from 'path';
import { ChannelLogger } from "./channel_logger.js";
import { BrowserWindow } from "electron";
import { ByYearGrouper, FileSegregator, GroupedFiles } from "./file_segregator.js";
import { FileMover } from "./file_mover.js";


export class MediaFilesHandler {
    private imageExtensions: Set<string>;
    private videoExtensions: Set<string>;
    private logger: ChannelLogger;
    private window: BrowserWindow;
    private folder_path: string | null;
    private grouped_files: GroupedFiles | null;


    constructor(channel_logger: ChannelLogger, window: BrowserWindow) {
        this.imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"]);
        this.videoExtensions = new Set([".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"]);
        this.logger = channel_logger;
        this.window = window
        this.grouped_files = null;
        this.folder_path = null
    }

    isImage(fileName: string): boolean {
        return this.imageExtensions.has(path.extname(fileName).toLowerCase());
    }

    isVideo(fileName: string): boolean {
        return this.videoExtensions.has(path.extname(fileName).toLowerCase());
    }

    setGroupedFiles(groupedFiles: GroupedFiles): void {
        this.grouped_files = groupedFiles;
    }
    getGroupedFiles(): GroupedFiles | null {
        return this.grouped_files;
    }

    setFolderPath(folderPath: string): void {
        this.folder_path = folderPath;
    }
    getFolderPath(): string | null {
        return this.folder_path;
    }


    async processFolderFiles(files: fs.Dirent[]) {
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
        this.logger.info(
            "<div>Total Count: images: " + images.length + ", videos: " + videos.length +
            "<br> Video files: " + videos.map(f => f.name).join(", ") +
            "<br> Image files: " + images.map(f => f.name).join(", ") + "</div>"
        )

        let files_to_propose = await new FileSegregator(videos, images).segregateFiles(new ByYearGrouper());
        this.setGroupedFiles(files_to_propose);
        console.log("serialized files: " + files_to_propose.serialize());
        this.window.webContents.send('proposal-channel', files_to_propose.serialize());
    }

    /**
     * handleFolderOpen function is called when the dialog:openDirectory is send from the renderer
     * this function runs on the server
     */
    handleFolderOpen = async () => {
        console.log("inside handle Open function");
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (canceled || filePaths.length === 0) {
            this.logger.info("User cancelled folder selection");
            return null;
        } else {
            const folderPath = filePaths[0];
            this.logger.info("User selected folder: " + folderPath);

            try {
                const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
                console.log("Files in the folder:");
                await this.processFolderFiles(files);
                this.setFolderPath(folderPath);
            } catch (err) {
                console.error('Error reading folder:', err);
            }
            return folderPath;
        }
    }

    /**
     * applyProposal 
     */
    applyProposal(proposal: string): void {
        this.logger.info("applying proposal in backend : " + proposal + "<br>");

        if (this.grouped_files && this.folder_path) {
            try {
                let mover = new FileMover(this.logger)
                mover.moveFiles(this.grouped_files, this.folder_path)

            } catch (err) {
                this.logger.info("Error applying proposal: " + proposal + " with error: " + err + "<br>");
            }
            this.grouped_files = null
            this.folder_path = null
        } else {
            this.logger.info("nothing to apply grouped files: " + this.grouped_files?.serialize() + " folder path: " + this.folder_path);
        }

    }

}
