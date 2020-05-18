'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-transport-dom-webpack-plugin.production.min.js');
} else {
  module.exports = require('./cjs/react-transport-dom-webpack-plugin.development.js');
}
