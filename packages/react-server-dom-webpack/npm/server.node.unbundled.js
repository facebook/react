'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-webpack-server.node.unbundled.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-webpack-server.node.unbundled.development.js');
}
