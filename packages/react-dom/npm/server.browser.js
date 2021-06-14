'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom-server-legacy.browser.production.min.js');
} else {
  module.exports = require('./cjs/react-dom-server-legacy.browser.development.js');
}
