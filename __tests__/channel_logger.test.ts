import { ChannelLogger } from '../channel_logger';
import { BrowserWindow } from 'electron';

// We need to mock the BrowserWindow and its webContents property for our unit test,
// as it's not available in the Node.js test environment.
const mockWebContents = {
  send: jest.fn(),
};

// We cast to `any` then to `BrowserWindow` to satisfy the type checker
// for our simplified mock object.
const mockBrowserWindow = {
  webContents: mockWebContents,
} as any as BrowserWindow;



describe('ChannelLogger', () => {
  const testChannel = 'test-channel';
  let logger: ChannelLogger;

  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    mockWebContents.send.mockClear();
    logger = new ChannelLogger(mockBrowserWindow, testChannel);
  });

  // paramtrize test each row here is a test nput and output
  test.each([
    ["info", "info message", { message: "info message", level: "info"}],
    ["debug", "debug message", { message: "debug message", level: "debug"}]
  ])("test %s log message logging", (method, message, expectedPayload) => {
    // ACT
    logger[method](message)
    
    // ASSERT
    expect(mockWebContents.send).toHaveBeenCalledTimes(1);
    // Expect it was called with the correct channel and payload
    expect(mockWebContents.send).toHaveBeenCalledWith(testChannel, expectedPayload);

  })
 
});