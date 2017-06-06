'use strict';
var path = require('path');

module.exports = {
  entry: './index.jsx',
  output: {
    path: path.resolve('./'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loaders: ['react-hot', 'babel']
    }]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  }
};
