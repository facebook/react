'use strict';

process.env.NODE_ENV = 'development';

module.exports = {
  setupFiles: [require.resolve('../../scripts/jest/setupEnvironment.js')],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'ES2015',
          target: 'ES2015',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          types: ['node', 'jest'],
        },
      },
    ],
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
};
