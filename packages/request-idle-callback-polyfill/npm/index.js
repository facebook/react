'use strict';

// @TODO figure out if we need a prod/dev build for this?
// if (process.env.NODE_ENV === 'production') {
//   module.exports = require('./cjs/{FILE}');
// } else {
//   module.exports = require('./cjs/{FILE}');
// }

module.exports = require('./cjs/request-idle-callback-polyfill.js');
