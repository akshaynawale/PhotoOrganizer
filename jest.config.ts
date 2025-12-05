import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest preset to work with TypeScript
  preset: 'ts-jest',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Automatically clear mock calls and instances between tests
  clearMocks: true,

  // Directory where Jest should store coverage files
  coverageDirectory: "coverage",

  // Tell ts-jest which tsconfig to use
  // (replaces old deprecated "globals" section)
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.main.json',
      },
    ],
  },

  testMatch: [
    "__tests__/**/*.(spec|test).ts",
    "**/?(*.)+(spec|test).ts"
  ],

  modulePathIgnorePatterns: [
    "/dist/"
  ],

};

export default config;
