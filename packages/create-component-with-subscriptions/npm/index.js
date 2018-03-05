'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/create-component-with-subscriptions.production.min.js');
} else {
  module.exports = require('./cjs/create-component-with-subscriptions.development.js');
}
