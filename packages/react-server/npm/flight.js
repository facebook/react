'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-flight.production.min.js');
} else {
  module.exports = require('./cjs/react-server-flight.development.js');
}
