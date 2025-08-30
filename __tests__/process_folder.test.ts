import { handleFolderOpen } from '../lib/process_folder';
import { dialog } from 'electron';
import { promises as fs } from 'fs';

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

// To use the mocked versions in tests, we cast them to Jest's mock types.
const mockedDialog = dialog as jest.Mocked<typeof dialog>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('handleFolderOpen', () => {
  // Clear mock history and reset implementations before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when the user cancels the dialog', async () => {
    // Arrange: Configure the mock to simulate a user cancellation.
    // `showOpenDialog` is async, so we use `mockResolvedValue`.
    mockedDialog.showOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });

    // Act: Call the function we are testing.
    const result = await handleFolderOpen();

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
    const fakeFiles = ['file1.jpg', 'file2.png'];
    mockedDialog.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: [fakeFolderPath],
    });
    // Mock the readdir to resolve with a fake file list
    mockedFs.readdir.mockResolvedValue(fakeFiles as any);

    // Act
    const result = await handleFolderOpen();

    // Assert
    expect(result).toBe(fakeFolderPath);
    expect(mockedDialog.showOpenDialog).toHaveBeenCalledTimes(1);
    expect(mockedFs.readdir).toHaveBeenCalledWith(fakeFolderPath);
    expect(mockedFs.readdir).toHaveBeenCalledTimes(1);
  });
});