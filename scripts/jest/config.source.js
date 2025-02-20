'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  moduleNameMapper: {
    '^babel-plugin-react-compiler$':
      '<rootDir>/compiler/packages/babel-plugin-react-compiler/src/index.ts',
  },
  modulePathIgnorePatterns: [
    ...baseConfig.modulePathIgnorePatterns,
    'packages/react-devtools-extensions',
    'packages/react-devtools-shared',
  ],
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupHostConfigs.js'),
  ],
});
