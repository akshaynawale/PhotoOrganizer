import * as fs from 'fs';
import path from 'path';
import { ChannelLogger } from './channel_logger';
import { GroupedFiles } from './file_segregator';

class FileMover {

    private logger: ChannelLogger;

    constructor(channel_logger: ChannelLogger) {
        this.logger = channel_logger;
    }

    async moveFiles(groupedFiles: GroupedFiles, destinationFolder: string): Promise<void> {
        this.logger.info(`Starting file move to: ${destinationFolder}`);

        for (const year in groupedFiles.videos) {
            const yearFolder = path.join(destinationFolder, year);
            await fs.promises.mkdir(yearFolder, { recursive: true });

            for (const file of groupedFiles.videos[year]) {
                const oldPath = path.join(file.parentPath, file.name);
                const newPath = path.join(yearFolder, file.name);
                await fs.promises.rename(oldPath, newPath);
                this.logger.info(`Moved video: ${oldPath} to ${newPath}`);
            }
        }

        for (const year in groupedFiles.images) {
            const yearFolder = path.join(destinationFolder, year);
            await fs.promises.mkdir(yearFolder, { recursive: true });

            for (const file of groupedFiles.images[year]) {
                const oldPath = path.join(file.parentPath, file.name);
                const newPath = path.join(yearFolder, file.name);
                await fs.promises.rename(oldPath, newPath);
                this.logger.info(`Moved image: ${oldPath} to ${newPath}`);
            }
        }
        this.logger.info("File move completed.");
    }
}

export { FileMover }