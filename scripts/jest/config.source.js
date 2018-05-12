'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  setupFiles: [
    ...baseConfig.setupFiles,
    require.resolve('./setupMocks.js')
  ],
});
