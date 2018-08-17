'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/interaction-tracking.production.min.js');
} else {
  module.exports = require('./cjs/interaction-tracking.development.js');
}
