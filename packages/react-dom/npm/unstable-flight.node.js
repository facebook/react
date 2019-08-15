'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom-unstable-flight.node.production.min.js');
} else {
  module.exports = require('./cjs/react-dom-unstable-flight.node.development.js');
}
