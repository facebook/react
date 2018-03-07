'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/create-subscription.production.min.js');
} else {
  module.exports = require('./cjs/create-subscription.development.js');
}
