'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom-unstable-testing.production.min.js');
} else {
  module.exports = require('./cjs/react-dom-unstable-testing.development.js');
}
