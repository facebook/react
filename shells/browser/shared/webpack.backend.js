const { readFileSync } = require('fs');
const { resolve } = require('path');
const { DefinePlugin } = require('webpack');

const __DEV__ = process.env.NODE_ENV !== 'production';

const DEVTOOLS_VERSION = JSON.parse(
  readFileSync(resolve(__dirname, '../../../package.json'))
).version;

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : false,
  entry: {
    backend: './src/backend.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },
  resolve: {
    alias: {
      src: resolve(__dirname, '../../../src'),
    },
  },
  plugins: [
    new DefinePlugin({
      __DEV__: true,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: JSON.parse(
          readFileSync(resolve(__dirname, '../../../.babelrc'))
        ),
      },
    ],
  },
};
