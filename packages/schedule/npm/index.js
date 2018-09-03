'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/schedule.production.min.js');
} else {
  module.exports = require('./cjs/schedule.development.js');
}
