const { readFileSync } = require('fs');
const { resolve } = require('path');
const { DefinePlugin } = require('webpack');
const { getGitHubURL, getVersionString } = require('../utils');

const __DEV__ = process.env.NODE_ENV === 'development';

const GITHUB_URL = getGitHubURL();
const DEVTOOLS_VERSION = getVersionString();

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: false,
  entry: {
    app: './app/index.js',
    backend: './src/backend.js',
    devtools: './src/devtools.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },
  resolve: {
    alias: {
      src: resolve(__dirname, '../../src'),
    },
  },
  plugins: [
    new DefinePlugin({
      __DEV__: __DEV__,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: JSON.parse(readFileSync(resolve(__dirname, '../../.babelrc'))),
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: true,
              localIdentName: '[local]___[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },
};
