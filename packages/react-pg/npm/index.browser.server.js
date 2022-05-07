'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-pg.browser.production.min.server.js');
} else {
  module.exports = require('./cjs/react-pg.browser.development.server.js');
}
