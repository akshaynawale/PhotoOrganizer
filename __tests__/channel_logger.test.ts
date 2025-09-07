import { ChannelLogger } from '../lib/channel_logger.js';
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

  logger = new ChannelLogger(mockBrowserWindow, testChannel);

  // parametrize test each row here is a test input and output
  test.each([
    ["info", "info message", { message: "info message", level: "info" }],
    ["debug", "debug message", { message: "debug message", level: "debug" }]
  ])("test %s log message logging", (method, message, expectedPayload) => {
    // ACT
    (logger as any)[method](message)

    // ASSERT
    expect(mockWebContents.send).toHaveBeenCalledTimes(1);
    // Expect it was called with the correct channel and payload
    expect(mockWebContents.send).toHaveBeenCalledWith(testChannel, expectedPayload);

  })

});