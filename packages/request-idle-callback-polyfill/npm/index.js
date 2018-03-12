'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/request-idle-callback-polyfill.production.min.js');
} else {
  module.exports = require('./cjs/request-idle-callback-polyfill.development.js');
}
