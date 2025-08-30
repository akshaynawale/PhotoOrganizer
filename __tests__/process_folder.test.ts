
// Mock the 'electron' module to control the behavior of `dialog`.
jest.mock('electron', () => ({
    dialog: {
        showOpenDialog: jest.fn(),
    },
}));

// Mock the 'fs' module's promises API.
jest.mock('fs', () => ({
    // Retain the original module structure but override `promises`.
    ...jest.requireActual('fs'),
    promises: {
        readdir: jest.fn(),
    },
}));


import { MediaFilesHandler } from '../lib/process_folder';
import { dialog } from 'electron';
import { promises as fs, Dirent } from 'fs';
import { ChannelLogger } from '../lib/channel_logger';


// To use the mocked versions in tests, we cast them to Jest's mock types.
const mockedDialog = dialog as jest.Mocked<typeof dialog>;
const mockedFs = fs as jest.Mocked<typeof fs>;


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
        const result = await mediaFilesHandler.handleFolderOpen();

        // Assert: Check if the function returned the expected value.
        expect(result).toBeNull();
        // Also assert that the dialog was shown.
        expect(mockedDialog.showOpenDialog).toHaveBeenCalledTimes(1);
        // And that readdir was NOT called.
        expect(mockedFs.readdir).not.toHaveBeenCalled();
    });

    it('should return the folder path and read its contents on success', async () => {
        // Arrange
        const fakeFolderPath = '/fake/path';
        const f1 = new Dirent();
        const f2 = new Dirent();
        const fakeFiles = [f1, f2];
        mockedDialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: [fakeFolderPath],
        });
        // Mock the readdir to resolve with a fake file list
        mockedFs.readdir.mockResolvedValue(fakeFiles as any);

        // Act

        const mediaFilesHandler = new MediaFilesHandler(mockLogger);

        const result = await mediaFilesHandler.handleFolderOpen();

        // Assert
        expect(result).toBe(fakeFolderPath);
        expect(mockedDialog.showOpenDialog).toHaveBeenCalledTimes(1);
        expect(mockedFs.readdir).toHaveBeenCalledWith(fakeFolderPath, { withFileTypes: true });
        expect(mockedFs.readdir).toHaveBeenCalledTimes(1);
    });
});

describe('testing processFolderFiles', () => {

    const mockLogger = {
        info: jest.fn(),
        debug: jest
    };

    it('with no images and videos', () => {
        let files: Dirent[] = [];

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
        mediaFilesHandler.processFolderFiles(input as unknown as Dirent[]);
        expect(mockLogger.info).toHaveBeenCalledTimes(4);
        expect(mockLogger.info).toHaveBeenCalledWith("total images: 2");
        expect(mockLogger.info).toHaveBeenCalledWith("total videos: 1");
        expect(mockLogger.info).toHaveBeenCalledWith("video files: vid.mp4");
        expect(mockLogger.info).toHaveBeenCalledWith("image files: image1.jpg,image2.png");
    });

})
