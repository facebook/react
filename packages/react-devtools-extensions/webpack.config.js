'use strict';

const {resolve} = require('path');
const Webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const {
  DARK_MODE_DIMMED_WARNING_COLOR,
  DARK_MODE_DIMMED_ERROR_COLOR,
  DARK_MODE_DIMMED_LOG_COLOR,
  LIGHT_MODE_DIMMED_WARNING_COLOR,
  LIGHT_MODE_DIMMED_ERROR_COLOR,
  LIGHT_MODE_DIMMED_LOG_COLOR,
  GITHUB_URL,
  getVersionString,
} = require('./utils');
const {resolveFeatureFlags} = require('react-devtools-shared/buildUtils');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const builtModulesDir = resolve(
  __dirname,
  '..',
  '..',
  'build',
  'oss-experimental',
);

const __DEV__ = NODE_ENV === 'development';

const DEVTOOLS_VERSION = getVersionString(process.env.DEVTOOLS_VERSION);

const EDITOR_URL = process.env.EDITOR_URL || null;
const LOGGING_URL = process.env.LOGGING_URL || null;

const IS_CHROME = process.env.IS_CHROME === 'true';
const IS_FIREFOX = process.env.IS_FIREFOX === 'true';
const IS_EDGE = process.env.IS_EDGE === 'true';

const featureFlagTarget = process.env.FEATURE_FLAG_TARGET || 'extension-oss';

const babelOptions = {
  configFile: resolve(
    __dirname,
    '..',
    'react-devtools-shared',
    'babel.config.js',
  ),
};

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'cheap-module-source-map' : false,
  entry: {
    background: './src/background.js',
    backendManager: './src/backendManager.js',
    main: './src/main.js',
    panel: './src/panel.js',
    proxy: './src/contentScripts/proxy.js',
    prepareInjection: './src/contentScripts/prepareInjection.js',
    renderer: './src/contentScripts/renderer.js',
    installHook: './src/contentScripts/installHook.js',
  },
  output: {
    path: __dirname + '/build',
    publicPath: '/build/',
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
  },
  node: {
    global: false,
  },
  resolve: {
    alias: {
      react: resolve(builtModulesDir, 'react'),
      'react-debug-tools': resolve(builtModulesDir, 'react-debug-tools'),
      'react-devtools-feature-flags': resolveFeatureFlags(featureFlagTarget),
      'react-dom/client': resolve(builtModulesDir, 'react-dom/client'),
      'react-dom': resolve(builtModulesDir, 'react-dom'),
      'react-is': resolve(builtModulesDir, 'react-is'),
      scheduler: resolve(builtModulesDir, 'scheduler'),
    },
  },
  optimization: {
    minimize: !__DEV__,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: false,
          mangle: {
            keep_fnames: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new Webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new Webpack.DefinePlugin({
      __DEV__,
      __EXPERIMENTAL__: true,
      __EXTENSION__: true,
      __PROFILE__: false,
      __TEST__: NODE_ENV === 'test',
      'process.env.DEVTOOLS_PACKAGE': `"react-devtools-extensions"`,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.EDITOR_URL': EDITOR_URL != null ? `"${EDITOR_URL}"` : null,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
      'process.env.LOGGING_URL': `"${LOGGING_URL}"`,
      'process.env.NODE_ENV': `"${NODE_ENV}"`,
      'process.env.DARK_MODE_DIMMED_WARNING_COLOR': `"${DARK_MODE_DIMMED_WARNING_COLOR}"`,
      'process.env.DARK_MODE_DIMMED_ERROR_COLOR': `"${DARK_MODE_DIMMED_ERROR_COLOR}"`,
      'process.env.DARK_MODE_DIMMED_LOG_COLOR': `"${DARK_MODE_DIMMED_LOG_COLOR}"`,
      'process.env.LIGHT_MODE_DIMMED_WARNING_COLOR': `"${LIGHT_MODE_DIMMED_WARNING_COLOR}"`,
      'process.env.LIGHT_MODE_DIMMED_ERROR_COLOR': `"${LIGHT_MODE_DIMMED_ERROR_COLOR}"`,
      'process.env.LIGHT_MODE_DIMMED_LOG_COLOR': `"${LIGHT_MODE_DIMMED_LOG_COLOR}"`,
      'process.env.IS_CHROME': IS_CHROME,
      'process.env.IS_FIREFOX': IS_FIREFOX,
      'process.env.IS_EDGE': IS_EDGE,
    }),
  ],
  module: {
    defaultRules: [
      {
        type: 'javascript/auto',
        resolve: {},
      },
      {
        test: /\.json$/i,
        type: 'json',
      },
    ],

    rules: [
      {
        test: /\.worker\.js$/,
        use: [
          {
            loader: 'workerize-loader',
            options: {
              inline: true,
              name: '[name]',
            },
          },
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
              modules: true,
              localIdentName: '[local]___[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },
};
