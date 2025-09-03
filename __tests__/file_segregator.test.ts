import { ByYearGrouper, FileSegregator, GroupedFiles } from '../lib/file_segregator';
import * as fs from 'fs';

describe('testing ByYearGrouper', () => {


    test.each([
        [new Date('2023-01-01'), '2023'],
        [new Date('2015-01-01'), '2015'],
    ])('test year %s', async (birthdate, expected_key) => {
        let f1 = {
            name: "image1.jpg",
            isFile: () => true,
            parentPath: "/fake/path/"
        } as unknown as fs.Dirent;

        // Mock statSync
        jest.spyOn(fs.promises, 'stat').mockResolvedValue({
            ctime: birthdate
        } as any);


        let grouper = new ByYearGrouper();
        let key = await grouper.getKey(f1);

        expect(key).toBe(expected_key);
    })
});

describe('testing FileSegregator', () => {
    let image_names = ["image1.jpg", "image2.png", "image3.jpg"];
    let video_names = ["vid1.mp4", "vid2.mp4", "vid3.mkv"];


    let images: fs.Dirent[] = image_names.map(
        (file) => {
            return { name: file, isFile: () => true, parentPath: "/fake/path/" } as unknown as fs.Dirent
        }
    )
    let videos: fs.Dirent[] = video_names.map(
        (file) => {
            return { name: file, isFile: () => true, parentPath: "/fake/path/" } as unknown as fs.Dirent
        }
    )

    let birth_dates: { [key: string]: Date } = {
        "/fake/path/image1.jpg": new Date('2023-01-01'),
        "/fake/path/image2.png": new Date('2024-01-01'),
        "/fake/path/image3.jpg": new Date('2024-12-03'),
        "/fake/path/vid1.mp4": new Date('2023-01-01'),
        "/fake/path/vid2.mp4": new Date('2024-01-01'),
        "/fake/path/vid3.mkv": new Date('2025-03-03')
    }

    let expected_result = new GroupedFiles();
    expected_result.images["2023"] = [images[0]];
    expected_result.images["2024"] = [images[1], images[2]];
    expected_result.videos["2023"] = [videos[0]];
    expected_result.videos["2024"] = [videos[1]];
    expected_result.videos["2025"] = [videos[2]];


    test.each([
        [[], [], new GroupedFiles()],
        [videos, images, expected_result],
    ])('test segregator with %', async (videos, images, expected_result) => {
        let segregator = new FileSegregator(videos, images);

        let by_year = new ByYearGrouper();

        const statMock = jest.spyOn(fs.promises, 'stat').mockImplementation(async (filePath: fs.PathLike): Promise<fs.Stats> => {
            return {
                ctime: birth_dates[filePath.toString()]
            } as any as fs.Stats;
        });

        let result = await segregator.segregateFiles(by_year);

        expect(result).toEqual(expected_result);
    })

})