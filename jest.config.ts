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
  moduleNameMapper: {
    "\.\.\/lib/(.*)\\.js$": "<rootDir>/lib/$1.ts", // to convert ../lib like js import to .ts
    "\.\/(channel_logger|file_segregator|file_mover|process_folder)\\.js$": "<rootDir>/lib/$1.ts",
    // to convert the ./<file-name>.js like import to .ts 
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
