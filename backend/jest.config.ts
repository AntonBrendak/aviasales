import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@packages/lib$': '<rootDir>/packages/lib/index.ts',
    '^@contracts/pricing$': '<rootDir>/packages/contracts/pricing/index.ts',
    '^@services/pricing/(.*)$': '<rootDir>/services/pricing/src/$1'
  },
  moduleFileExtensions: ['ts','tsx','js','json'],
  collectCoverageFrom: [
    'services/pricing/src/domain/**/*.ts'
  ],
  verbose: true
};

export default config;