'use strict';

const {resolve, isAbsolute, relative} = require('path');
const Webpack = require('webpack');

const {resolveFeatureFlags} = require('react-devtools-shared/buildUtils');
const SourceMapIgnoreListPlugin = require('react-devtools-shared/SourceMapIgnoreListPlugin');

const {GITHUB_URL, getVersionString} = require('./utils');

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
      'process.env.IS_CHROME': IS_CHROME,
      'process.env.IS_FIREFOX': IS_FIREFOX,
      'process.env.IS_EDGE': IS_EDGE,
      __IS_CHROME__: IS_CHROME,
      __IS_FIREFOX__: IS_FIREFOX,
      __IS_EDGE__: IS_EDGE,
      __IS_NATIVE__: false,
    }),
    new Webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      noSources: !__DEV__,
      // https://github.com/webpack/webpack/issues/3603#issuecomment-1743147144
      moduleFilenameTemplate(info) {
        const {absoluteResourcePath, namespace, resourcePath} = info;

        if (isAbsolute(absoluteResourcePath)) {
          return relative(__dirname + '/build', absoluteResourcePath);
        }

        // Mimic Webpack's default behavior:
        return `webpack://${namespace}/${resourcePath}`;
      },
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
