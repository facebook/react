'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-client-flight-hooks.production.min.js');
} else {
  module.exports = require('./cjs/react-client-flight-hooks.development.js');
}
