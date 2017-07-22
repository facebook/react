'use strict';

const config = require('./config');

module.exports = Object.assign({}, config, {
  setupFiles: ['./scripts/jest/stack.setup.js'].concat(config.setupFiles),
});
