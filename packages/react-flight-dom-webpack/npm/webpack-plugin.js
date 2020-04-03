'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-flight-dom-webpack-webpack-plugin.production.min.js');
} else {
  module.exports = require('./cjs/react-flight-dom-webpack-webpack-plugin.development.js');
}
