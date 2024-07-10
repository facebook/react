'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-turbopack-server.node.unbundled.production.js');
} else {
  module.exports = require('./cjs/react-server-dom-turbopack-server.node.unbundled.development.js');
}
