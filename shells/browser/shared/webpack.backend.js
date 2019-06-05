const { resolve } = require('path');
const { DefinePlugin } = require('webpack');
const { getGitHubURL, getVersionString } = require('../../utils');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const __DEV__ = NODE_ENV === 'development';

const GITHUB_URL = getGitHubURL();
const DEVTOOLS_VERSION = getVersionString();

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
      'react-window': resolve(__dirname, '../../../vendor/react-window'),
    },
  },
  plugins: [
    new DefinePlugin({
      __DEV__: true,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          configFile: resolve(__dirname, '../../../babel.config.js'),
        },
      },
    ],
  },
};
