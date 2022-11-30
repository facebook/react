'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-server-dom-webpack-client.production.min.js');
} else {
  module.exports = require('./cjs/react-server-dom-webpack-client.development.js');
}
