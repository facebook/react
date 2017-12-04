'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-test-renderer-shallow.production.min.js');
} else {
  module.exports = require('./cjs/react-test-renderer-shallow.development.js');
}
