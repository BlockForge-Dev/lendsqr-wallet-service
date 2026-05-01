import type { Config } from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/tests/**'],
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
};

export default config;
