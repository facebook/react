'use strict';

const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
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
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : false,
  entry: {
    background: './src/background.js',
    contentScript: './src/contentScript.js',
    injectGlobalHook: './src/injectGlobalHook.js',
    main: './src/main.js',
    panel: './src/panel.js',
    renderer: './src/renderer.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
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
  plugins: [
    new DefinePlugin({
      __DEV__: false,
      __PROFILE__: false,
      __EXPERIMENTAL__: true,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
      'process.env.NODE_ENV': `"${NODE_ENV}"`,
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
