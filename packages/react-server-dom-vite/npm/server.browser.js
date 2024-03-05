'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-vite-server.browser.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-vite-server.browser.development.js');
}
