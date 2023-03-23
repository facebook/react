'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-webpack-server.edge.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-webpack-server.edge.development.js');
}
