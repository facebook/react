'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  roots: ['<rootDir>/packages/react-dom'],
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupFire.js'),
    require.resolve('./setupHostConfigs.js'),
  ],
});
