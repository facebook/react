'use strict';

const config = require('./config');

module.exports = Object.assign({}, config, {
  setupFiles: ['./scripts/jest/fiber.setup.js'].concat(config.setupFiles),
});
