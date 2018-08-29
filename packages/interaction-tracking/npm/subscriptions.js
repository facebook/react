'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/interaction-tracking-subscriptions.production.min.js');
} else {
  module.exports = require('./cjs/interaction-tracking-subscriptions.development.js');
}
