'use strict';

const {resolve} = require('path');
const Webpack = require('webpack');

const {resolveFeatureFlags} = require('react-devtools-shared/buildUtils');
const SourceMapIgnoreListPlugin = require('react-devtools-shared/SourceMapIgnoreListPlugin');

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

const IS_CHROME = process.env.IS_CHROME === 'true';
const IS_FIREFOX = process.env.IS_FIREFOX === 'true';
const IS_EDGE = process.env.IS_EDGE === 'true';

const featureFlagTarget = process.env.FEATURE_FLAG_TARGET || 'extension-oss';

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: false,
  entry: {
    backend: './src/backend.js',
  },
  output: {
    path: __dirname + '/build',
    filename: 'react_devtools_backend_compact.js',
  },
  node: {
    global: false,
  },
  resolve: {
    alias: {
      react: resolve(builtModulesDir, 'react'),
      'react-debug-tools': resolve(builtModulesDir, 'react-debug-tools'),
      'react-devtools-feature-flags': resolveFeatureFlags(featureFlagTarget),
      'react-dom': resolve(builtModulesDir, 'react-dom'),
      'react-is': resolve(builtModulesDir, 'react-is'),
      scheduler: resolve(builtModulesDir, 'scheduler'),
    },
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new Webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new Webpack.DefinePlugin({
      __DEV__: true,
      __PROFILE__: false,
      __DEV____DEV__: true,
      // By importing `shared/` we may import ReactFeatureFlags
      __EXPERIMENTAL__: true,
      'process.env.DEVTOOLS_PACKAGE': `"react-devtools-extensions"`,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
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
    new Webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      noSources: !__DEV__,
    }),
    new SourceMapIgnoreListPlugin({
      shouldIgnoreSource: () => !__DEV__,
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
