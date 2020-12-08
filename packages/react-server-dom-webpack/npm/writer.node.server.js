'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-webpack-writer.node.server.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-webpack-writer.node.server.development.js');
}
