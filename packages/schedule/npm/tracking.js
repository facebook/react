'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/schedule-tracking.production.min.js');
} else {
  module.exports = require('./cjs/schedule-tracking.development.js');
}
