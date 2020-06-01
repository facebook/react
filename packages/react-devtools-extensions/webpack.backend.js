'use strict';

const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const {GITHUB_URL, getVersionString} = require('./utils');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const builtModulesDir = resolve(__dirname, '..', '..', 'build', 'node_modules');

const __DEV__ = NODE_ENV === 'development';

const DEVTOOLS_VERSION = getVersionString();

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: false,
  entry: {
    backend: './src/backend.js',
  },
  output: {
    path: __dirname + '/build',
    filename: 'react_devtools_backend.js',
  },
  node: {
    // Don't define a polyfill on window.setImmediate
    setImmediate: false,
  },
  resolve: {
    alias: {
      react: resolve(builtModulesDir, 'react'),
      'react-debug-tools': resolve(builtModulesDir, 'react-debug-tools'),
      'react-dom': resolve(builtModulesDir, 'react-dom'),
      'react-is': resolve(builtModulesDir, 'react-is'),
      scheduler: resolve(builtModulesDir, 'scheduler'),
    },
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {drop_debugger: false},
          output: {comments: true},
        },
      }),
    ],
  },
  plugins: [
    new DefinePlugin({
      __DEV__: true,
      __PROFILE__: false,
      __EXPERIMENTAL__: true,
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
          configFile: resolve(
            __dirname,
            '..',
            'react-devtools-shared',
            'babel.config.js',
          ),
        },
      },
    ],
  },
};
