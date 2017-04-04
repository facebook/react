'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-dom-server.production.min.js');
} else {
  module.exports = require('./cjs/react-dom-server.development.js');
}
