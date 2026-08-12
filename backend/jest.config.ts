import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: false,
  coverageDirectory: 'coverage',
  testTimeout: 30000,
};

export default config;
