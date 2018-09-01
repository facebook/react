'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-scheduler-tracking.production.min.js');
} else {
  module.exports = require('./cjs/react-scheduler-tracking.development.js');
}
