'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-unstable-cache.production.min.js');
} else {
  module.exports = require('./cjs/react-unstable-cache.development.js');
}
