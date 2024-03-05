'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-vite-client.edge.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-vite-client.edge.development.js');
}
