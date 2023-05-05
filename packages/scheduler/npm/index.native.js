'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/scheduler.native.production.min.js');
} else {
  module.exports = require('./cjs/scheduler.native.development.js');
}
