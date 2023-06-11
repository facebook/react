'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-vite-server.node.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-vite-server.node.development.js');
}
