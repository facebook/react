'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/simple-cache-provider.production.min.js');
} else {
  module.exports = require('./cjs/simple-cache-provider.development.js');
}
