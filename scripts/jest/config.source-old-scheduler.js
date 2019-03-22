'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupOldScheduler.js'),
    require.resolve('./setupHostConfigs.js'),
  ],
});
