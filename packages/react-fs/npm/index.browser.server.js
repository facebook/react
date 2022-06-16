'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-fs.browser.production.min.server.js');
} else {
  module.exports = require('./cjs/react-fs.browser.development.server.js');
}
