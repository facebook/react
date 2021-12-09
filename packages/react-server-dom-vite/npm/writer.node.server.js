'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-vite-writer.node.production.min.server.js');
} else {
  module.exports = require('./cjs/react-server-dom-vite-writer.node.development.server.js');
}
