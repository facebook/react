'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom-unstable-flight-server.browser.production.min.js');
} else {
  module.exports = require('./cjs/react-dom-unstable-flight-server.browser.development.js');
}
