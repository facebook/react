'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-webpack-server.browser.production.js');
} else {
  module.exports = require('./cjs/react-server-dom-webpack-server.browser.development.js');
}
