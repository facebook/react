'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-client-flight.production.min.js');
} else {
  module.exports = require('./cjs/react-client-flight.development.js');
}
