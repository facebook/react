'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-turbopack-server.edge.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-turbopack-server.edge.development.js');
}
