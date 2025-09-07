
// Mock the 'electron' module to control the behavior of `dialog`.
jest.mock('electron', () => ({
    dialog: {
        showOpenDialog: jest.fn(),
    },
}));

import { MediaFilesHandler } from '../lib/process_folder';
import { dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { ChannelLogger } from '../lib/channel_logger';
import { GroupedFiles } from '../lib/file_segregator';
import { FileMover } from '../lib/file_mover';
jest.mock("../lib/file_mover")

// To use the mocked versions in tests, we cast them to Jest's mock types.
const mockedDialog = dialog as jest.Mocked<typeof dialog>;

describe('handleFolderOpen', () => {

    const mockLogger = {
        info: jest.fn(),
        debug: jest.fn(),
    } as unknown as ChannelLogger;
    const mockBrowserWin = {
        webContents: {
            send: jest.fn()
        }
    } as unknown as BrowserWindow;


    it('should return null when the user cancels the dialog', async () => {
        // Arrange: Configure the mock to simulate a user cancellation.
        // `showOpenDialog` is async, so we use `mockResolvedValue`.
        mockedDialog.showOpenDialog.mockResolvedValue({
            canceled: true,
            filePaths: [],
        });


        // Act

        const mediaFilesHandler = new MediaFilesHandler(mockLogger, mockBrowserWin);
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

        const mediaFilesHandler = new MediaFilesHandler(mockLogger, mockBrowserWin);
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
        debug: jest.fn(),
    } as unknown as ChannelLogger;
    const mockBrowserWin = {
        webContents: {
            send: jest.fn()
        }
    } as unknown as BrowserWindow;

    it('with no images and videos', async () => {
        let files: fs.Dirent[] = [];

        const mediaFilesHandler = new MediaFilesHandler(mockLogger, mockBrowserWin);
        await mediaFilesHandler.processFolderFiles(files);
        expect(mockLogger.info).toHaveBeenCalledTimes(1);

        expect(mockLogger.info).toHaveBeenCalledWith(
            "<div>Total Count: images: 0, videos: 0<br> " +
            "Video files: <br> Image files: </div>"
        );

    });


    it('with some images and videos', async () => {

        // ARRANGE
        let filenames: string[] = ["image1.jpg", "image2.png", "vid.mp4", "document.txt"];
        let input = filenames.map(filename => (
            {
                name: filename,
                isFile: () => true,
                parentPath: "/fake/path/"
            })) as unknown as fs.Dirent[];

        const mediaFilesHandler = new MediaFilesHandler(mockLogger, mockBrowserWin);

        let birth_dates: { [key: string]: Date } = {
            "/fake/path/image1.jpg": new Date('2023-01-01'),
            "/fake/path/image2.png": new Date('2024-01-01'),
            "/fake/path/vid.mp4": new Date('2024-12-03')
        };
        const statMock = jest.spyOn(fs.promises, 'stat').mockImplementation(
            async (filePath: fs.PathLike): Promise<fs.Stats> => {
                return {
                    mtime: birth_dates[filePath.toString()]
                } as any as fs.Stats;
            }
        );

        // ACT
        await mediaFilesHandler.processFolderFiles(input);

        // ASSERT
        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith(
            "<div>Total Count: images: 2, videos: 1<br> " +
            "Video files: vid.mp4<br> Image files: image1.jpg, image2.png</div>"
        );

    });

})



describe('testing applyProposal', () => {

    const mockLogger = {
        info: jest.fn(),
        debug: jest.fn(),
    } as unknown as ChannelLogger;
    const mockBrowserWin = {
        webContents: {
            send: jest.fn()
        }
    } as unknown as BrowserWindow;


    it("testing apply proposal without grouped files to apply", () => {

        let media_handler = new MediaFilesHandler(mockLogger, mockBrowserWin);

        media_handler.applyProposal("test_proposal");

        expect(mockLogger.info).toHaveBeenCalledTimes(2);
        expect(mockLogger.info).toHaveBeenCalledWith("applying proposal in backend : test_proposal<br>");
        expect(mockLogger.info).toHaveBeenCalledWith("nothing to apply grouped files: undefined folder path: null");
    })


    it("testing apply proposal with grouped files to apply", () => {

        let media_handler = new MediaFilesHandler(mockLogger, mockBrowserWin);
        let test_grouped_files = new GroupedFiles();
        media_handler.setGroupedFiles(test_grouped_files);
        media_handler.setFolderPath("/fake/path");
        const m_moveFiles = jest.spyOn(FileMover.prototype, "moveFiles").mockResolvedValue(undefined);

        media_handler.applyProposal("test_proposal");

        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith("applying proposal in backend : test_proposal<br>");
        expect(FileMover).toHaveBeenCalledTimes(1);
        expect(FileMover).toHaveBeenCalledWith(mockLogger);
        expect(m_moveFiles).toHaveBeenCalledTimes(1);
        expect(m_moveFiles).toHaveBeenCalledWith(test_grouped_files, "/fake/path");
        expect(media_handler.getFolderPath()).toBeNull();
        expect(media_handler.getGroupedFiles()).toBeNull();

    })

    it("testing apply proposal with grouped files but moveFiles fails", () => {

        let media_handler = new MediaFilesHandler(mockLogger, mockBrowserWin);
        let test_grouped_files = new GroupedFiles();
        media_handler.setGroupedFiles(test_grouped_files);
        media_handler.setFolderPath("/fake/path");
        const m_moveFiles = jest.spyOn(FileMover.prototype, "moveFiles").mockImplementation(
            () => {
                throw new Error("test error");
            }
        );

        media_handler.applyProposal("test_proposal");

        expect(mockLogger.info).toHaveBeenCalledTimes(2);
        expect(mockLogger.info).toHaveBeenCalledWith("applying proposal in backend : test_proposal<br>");
        expect(mockLogger.info).toHaveBeenCalledWith("Error applying proposal: test_proposal with error: Error: test error<br>");
        expect(FileMover).toHaveBeenCalledTimes(1);
        expect(FileMover).toHaveBeenCalledWith(mockLogger);
        expect(m_moveFiles).toHaveBeenCalledTimes(1);
        expect(m_moveFiles).toHaveBeenCalledWith(test_grouped_files, "/fake/path");
        expect(media_handler.getFolderPath()).toBeNull();
        expect(media_handler.getGroupedFiles()).toBeNull();
    })

})