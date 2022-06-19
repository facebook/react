'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom-static.browser.production.min.js');
} else {
  module.exports = require('./cjs/react-dom-static.browser.development.js');
}
