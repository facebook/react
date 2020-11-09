'use strict';

const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const {getVersionString} = require('./buildUtils');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}
const __DEV__ = NODE_ENV === 'development';

const TARGET = process.env.TARGET;
if (!TARGET) {
  console.error('TARGET not set');
  process.exit(1);
}
const shouldUseDevServer = TARGET === 'local';

const builtModulesDir = resolve(__dirname, '..', '..', 'build', 'node_modules');

const DEVTOOLS_VERSION = getVersionString();

const imageInlineSizeLimit = 10000;

const babelOptions = {
  configFile: resolve(
    __dirname,
    '..',
    'react-devtools-shared',
    'babel.config.js',
  ),
  plugins: shouldUseDevServer
    ? [resolve(builtModulesDir, 'react-refresh/babel')]
    : [],
};

const config = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : 'source-map',
  entry: {
    app: './src/index.js',
  },
  resolve: {
    alias: {
      react: resolve(builtModulesDir, 'react'),
      'react-dom': resolve(builtModulesDir, 'react-dom'),
      'react-refresh': resolve(builtModulesDir, 'react-refresh'),
    },
  },
  plugins: [
    new DefinePlugin({
      __DEV__,
      __PROFILE__: false,
      __EXPERIMENTAL__: true,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
    }),
    new HtmlWebpackPlugin({
      title: 'React Concurrent Mode Profiler',
    }),
    shouldUseDevServer && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  module: {
    rules: [
      {
        test: /\.worker\.js$/,
        use: [
          'worker-loader',
          {
            loader: 'babel-loader',
            options: babelOptions,
          },
        ],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: babelOptions,
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
              modules: {
                localIdentName: '[local]___[hash:base64:5]',
              },
            },
          },
        ],
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: 'url-loader',
        options: {
          limit: imageInlineSizeLimit,
          name: 'static/media/[name].[hash:8].[ext]',
        },
      },
    ],
  },
};

if (shouldUseDevServer) {
  config.devServer = {
    hot: true,
    port: 8080,
    clientLogLevel: 'warning',
    stats: 'errors-only',
  };
} else {
  config.output = {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
  };
}

module.exports = config;
