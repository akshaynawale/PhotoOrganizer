import { PathLike } from "original-fs";
import { ChannelLogger } from "../src/main/lib/channel_logger";
import { FileMover } from "../src/main/lib/file_mover";
import { GroupedFiles } from "../src/main/lib/file_segregator";
import * as fs from 'fs';
import path from "path";

describe('File MOver move files', () => {


    it("testing file moves ", async () => {

        // ARRANGE
        let mockChannelLogger = {
            info: jest.fn(),
            debug: jest.fn(),
        } as unknown as ChannelLogger;

        let test_images: fs.Dirent[] = ["image1.jpg", "image2.png", "image3.jpg"].map(
            (file) => {
                return { name: file, isFile: () => true, parentPath: "/fake/path/" } as unknown as fs.Dirent
            }
        )
        let test_videos: fs.Dirent[] = ["vid1.mp4", "vid2.mov"].map(
            (file) => {
                return { name: file, isFile: () => true, parentPath: "/fake/path/" } as unknown as fs.Dirent
            }
        )

        let groupedFiles = new GroupedFiles();
        groupedFiles.images = { "2024": test_images };
        groupedFiles.videos = { "2025": test_videos };


        let mover = new FileMover(mockChannelLogger);

        let m_rename = jest.spyOn(fs.promises, "rename").mockResolvedValue(undefined);

        let m_mkdir = jest.spyOn(fs.promises, "mkdir").mockResolvedValue(undefined);

        // ACT 
        await mover.moveFiles(groupedFiles, "proposal");

        // ASSERT
        expect(m_rename).toHaveBeenCalledTimes(5);
        expect(m_mkdir).toHaveBeenCalledTimes(2);

        test_images.forEach((f) => {
            let exp_old_path = path.join(f.parentPath, f.name)
            let exp_new_path = path.join("proposal", "2024", f.name)
            expect(m_rename).toHaveBeenCalledWith(exp_old_path, exp_new_path)
        });
        test_videos.forEach((f) => {
            let exp_old_path = path.join(f.parentPath, f.name)
            let exp_new_path = path.join("proposal", "2025", f.name)
            expect(m_rename).toHaveBeenCalledWith(exp_old_path, exp_new_path)
        });

    })

})
