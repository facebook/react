'use strict';

if (process.env.NODE_ENV !== 'production') {
  module.exports = require('./cjs/test-utils.development.js');
}
