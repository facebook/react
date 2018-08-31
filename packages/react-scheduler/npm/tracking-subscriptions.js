'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-scheduler-tracking-subscriptions.production.min.js');
} else {
  module.exports = require('./cjs/react-scheduler-tracking-subscriptions.development.js');
}
