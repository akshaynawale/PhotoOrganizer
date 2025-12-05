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


    /**
     * 
     * @param file_path string representing the file path 
     * @returns 
     */
    async get_with_fsstat(file_path: string): Promise<string> {
        let fstat = await fs.promises.stat(file_path);
        return fstat.mtime.getFullYear().toString() + "-" + fstat.mtime.toLocaleString(
            "en-US", { month: "short" }
        );
    }

    /**
     * 
     * @param file_path file path of image /video for which we need to find the year and month from metadatafile
     * @returns 
     */
    async get_with_metadata(file_path: string, metadata_file_path: string): Promise<string> {
        let metadata_file_data = await fs.promises.readFile(metadata_file_path, "utf-8");
        const metadata = JSON.parse(metadata_file_data);
        const photo_taken_date = new Date(metadata["photoTakenTime"]["formatted"]);
        console.log(
            "found photoTakenTime from json file : " +
            photo_taken_date.toDateString() + " for file: " + file_path + ""
        );
        return photo_taken_date.getFullYear().toString() + "-" + photo_taken_date.toLocaleString(
            "en-US", { month: "short" }
        );
    }

    async getKey(file: fs.Dirent): Promise<string> {
        const file_path = path.join(file.parentPath, file.name);

        const metadata_ext_to_try: string[] = [
            ".supplemental-metadata.json",
            ".suppleme.json",
            ".suppl.json",
            ".supplemental-met.json",
            ".supplemen.json",
            ".supplemental-metad.json"
        ]

        for (const ext of metadata_ext_to_try) {
            const metadata_file_path = file_path + ext;
            try {
                return await this.get_with_metadata(file_path, metadata_file_path)
            } catch (err) {
                console.log("unable to get metadata for file: " + file.name + " error: " + err);
            }

        }

        // lastly try with the file with fs stat
        try {
            // Use the helper to maintain a consistent key format
            return await this.get_with_fsstat(file_path);
        } catch (err) {
            // If fs.stat also fails (e.g., file not found), log the error
            // and return a fallback key to prevent the promise from rejecting.
            console.log(`Failed to stat file: ${file.name} at ${file_path}. Error: ${err}`);
            return "unknown-date"; // Provide a fallback key when no date can be determined
        }
    }
}

/**
 * GroupedFiles contains all the grouped images and videos 
 * FileSegregator creates this class and then this class is used to 
 * create the actual segregated files
 */
export class GroupedFiles {
    videos: { [key: string]: fs.Dirent[] };
    images: { [key: string]: fs.Dirent[] };

    constructor() {
        this.videos = {};
        this.images = {};
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

        // getting all the keys in parallel (or actually asynchronously) with Promises.all
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