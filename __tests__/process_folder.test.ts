
// Mock the 'electron' module to control the behavior of `dialog`.
jest.mock('electron', () => ({
    dialog: {
        showOpenDialog: jest.fn(),
    },
}));

import { MediaFilesHandler, ByYearGrouper, FileSegregator } from '../lib/process_folder';
import { dialog } from 'electron';
import * as fs from 'fs';
import { ChannelLogger } from '../lib/channel_logger';

// To use the mocked versions in tests, we cast them to Jest's mock types.
const mockedDialog = dialog as jest.Mocked<typeof dialog>;

describe('handleFolderOpen', () => {

    const mockLogger = {
        info: jest.fn(),
        debug: jest.fn(),
    } as unknown as ChannelLogger;


    it('should return null when the user cancels the dialog', async () => {
        // Arrange: Configure the mock to simulate a user cancellation.
        // `showOpenDialog` is async, so we use `mockResolvedValue`.
        mockedDialog.showOpenDialog.mockResolvedValue({
            canceled: true,
            filePaths: [],
        });

        // Act

        const mediaFilesHandler = new MediaFilesHandler(mockLogger);
        // Act: Call the function we are testing.
        const readdirSpy = jest.spyOn(fs.promises, "readdir").mockResolvedValue([] as any)
        const result = await mediaFilesHandler.handleFolderOpen();

        // Assert: Check if the function returned the expected value.
        expect(result).toBeNull();
        // Also assert that the dialog was shown.
        expect(mockedDialog.showOpenDialog).toHaveBeenCalledTimes(1);
        // And that readdir was NOT called.
        expect(readdirSpy).not.toHaveBeenCalled();
    });

    it('should return the folder path and read its contents on success', async () => {
        // Arrange
        const fakeFolderPath = '/fake/path';
        const f1 = new fs.Dirent();
        const f2 = new fs.Dirent();
        const fakeFiles = [f1, f2];
        mockedDialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: [fakeFolderPath],
        });
        // Mock the readdir to resolve with a fake file list
        // mockedFs.readdir.mockResolvedValue(fakeFiles as any);
        // Act

        const mediaFilesHandler = new MediaFilesHandler(mockLogger);
        const readdirSpy = jest.spyOn(fs.promises, "readdir").mockResolvedValue(fakeFiles as any)


        const result = await mediaFilesHandler.handleFolderOpen();

        // Assert
        expect(result).toBe(fakeFolderPath);
        expect(mockedDialog.showOpenDialog).toHaveBeenCalledTimes(1);
        expect(readdirSpy).toHaveBeenCalledWith(fakeFolderPath, { withFileTypes: true });
        expect(readdirSpy).toHaveBeenCalledTimes(1);
    });
});

describe('testing processFolderFiles', () => {

    const mockLogger = {
        info: jest.fn(),
        debug: jest
    };

    it('with no images and videos', () => {
        let files: fs.Dirent[] = [];

        const mediaFilesHandler = new MediaFilesHandler(mockLogger as unknown as ChannelLogger);
        mediaFilesHandler.processFolderFiles(files);
        expect(mockLogger.info).toHaveBeenCalledTimes(4);
        expect(mockLogger.info).toHaveBeenCalledWith("total images: 0");
        expect(mockLogger.info).toHaveBeenCalledWith("total videos: 0");
        expect(mockLogger.info).toHaveBeenCalledWith("video files: ");
        expect(mockLogger.info).toHaveBeenCalledWith("image files: ");
    });

    it('with some images and videos', () => {


        let filenames: string[] = ["image1.jpg", "image2.png", "vid.mp4", "document.txt"];
        let input = filenames.map(filename => ({ name: filename, isFile: () => true }));


        const mediaFilesHandler = new MediaFilesHandler(mockLogger as unknown as ChannelLogger);
        mediaFilesHandler.processFolderFiles(input as unknown as fs.Dirent[]);
        expect(mockLogger.info).toHaveBeenCalledTimes(4);
        expect(mockLogger.info).toHaveBeenCalledWith("total images: 2");
        expect(mockLogger.info).toHaveBeenCalledWith("total videos: 1");
        expect(mockLogger.info).toHaveBeenCalledWith("video files: vid.mp4");
        expect(mockLogger.info).toHaveBeenCalledWith("image files: image1.jpg,image2.png");
    });

})



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
        jest.spyOn(fs.promises, 'stat').mockReturnValue({
            birthtime: birthdate
        } as any);


        let grouper = new ByYearGrouper();
        let key = await grouper.getKey(f1);

        expect(key).toBe(expected_key);
    })
});

describe('testing FileSegregator', () => {

    let f1 = {
        name: "image1.png",
        isFile: () => true,
        parentPath: "/fake/path/"
    } as unknown as fs.Dirent;

    let f2 = {
        name: "image2.jpg",
        isFile: () => true,
        parentPath: "/fake/path/"
    } as unknown as fs.Dirent;

    let f3 = {
        name: "image3.jpg",
        isFile: () => true,
        parentPath: "/fake/path2/"
    } as unknown as fs.Dirent;

    let birth_dates: { [key: string]: Date } = {
        "/fake/path/image1.png": new Date('2023-01-01'),
        "/fake/path/image2.jpg": new Date('2024-01-01'),
        "/fake/path2/image3.jpg": new Date('2024-12-03')
    }

    test.each([
        [[], {}],
        [[f1], { "2023": [f1] }],
        [[f1, f2], { "2023": [f1], "2024": [f2] }],
        [[f1, f2, f3], { "2023": [f1], "2024": [f2, f3] }]
    ])('test segregator with %', async (files, expected_result) => {
        let segregator = new FileSegregator(files);

        let by_year = new ByYearGrouper();

        const statMock = jest.spyOn(fs.promises, 'stat').mockImplementation(async (filePath: fs.PathLike): Promise<fs.Stats> => {
            return {
                birthtime: birth_dates[filePath.toString()]
            } as any as fs.Stats;
        });

        let result = await segregator.segregateFiles(by_year);

        expect(result).toEqual(expected_result);
    })

})