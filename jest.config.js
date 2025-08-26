module.exports = {
  // Use ts-jest preset to work with TypeScript
  preset: 'ts-jest',
  // The test environment that will be used for testing, 'node' for main process files
  testEnvironment: 'node',
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
};
