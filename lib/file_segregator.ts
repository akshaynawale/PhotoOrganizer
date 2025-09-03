import * as fs from 'fs';
import path from 'path';


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

/**
 * GroupedFiles contains all the grouped images and videos 
 * FileSegregator creates this class and then this class is used to 
 * create the acutal segregated files
 */
export class GroupedFiles {
    videos: { [key: string]: fs.Dirent[] };
    images: { [key: string]: fs.Dirent[] };

    constructor() {
        this.videos = {};
        this.images = {}
    }

    serialize(): string {
        let to_serialize: {
            [key: string]: { [key: string]: string[] }
        } = {
            "videos": {}, "images": {}
        };

        for (let k in this.videos) {
            to_serialize["videos"][k] = this.videos[k].map(f => f.name);
        };

        for (let k in this.images) {
            to_serialize["images"][k] = this.images[k].map(f => f.name);
        };

        return JSON.stringify(to_serialize);
    };
}

/**
 * FileSegregator is used to segregate a files with a grouper strategy
 */
export class FileSegregator {

    images: fs.Dirent[];
    videos: fs.Dirent[];

    constructor(videos: fs.Dirent[], images: fs.Dirent[]) {
        this.videos = videos;
        this.images = images

    }

    async segregateFiles(strategy: FileGrouper): Promise<GroupedFiles> {

        let groupedFiles: GroupedFiles = new GroupedFiles();

        // getting all the keys parallely(or actually asynchronously) with Promises.all
        let imagekeys = await Promise.all(this.images.map((f) => strategy.getKey(f)))
        let videokeys = await Promise.all(this.videos.map((f) => strategy.getKey(f)))

        this.images.forEach((f, i) => {
            let key = imagekeys[i];
            if (!groupedFiles.images[key]) {
                groupedFiles.images[key] = [];
            }
            groupedFiles.images[key].push(f);
        });

        this.videos.forEach((f, i) => {
            let key = videokeys[i];
            if (!groupedFiles.videos[key]) {
                groupedFiles.videos[key] = [];
            }
            groupedFiles.videos[key].push(f);
        });

        return groupedFiles
    }
}