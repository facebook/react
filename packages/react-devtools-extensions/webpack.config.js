'use strict';

const {resolve, isAbsolute, relative} = require('path');
const Webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const {GITHUB_URL, getVersionString} = require('./utils');
const {resolveFeatureFlags} = require('react-devtools-shared/buildUtils');
const SourceMapIgnoreListPlugin = require('react-devtools-shared/SourceMapIgnoreListPlugin');

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
const IS_INTERNAL_VERSION = process.env.FEATURE_FLAG_TARGET === 'extension-fb';

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
  devtool: false,
  entry: {
    background: './src/background/index.js',
    backendManager: './src/contentScripts/backendManager.js',
    fileFetcher: './src/contentScripts/fileFetcher.js',
    main: './src/main/index.js',
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
          compress: {
            unused: true,
            dead_code: true,
          },
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
      __IS_CHROME__: IS_CHROME,
      __IS_FIREFOX__: IS_FIREFOX,
      __IS_EDGE__: IS_EDGE,
      __IS_NATIVE__: false,
      __IS_INTERNAL_VERSION__: IS_INTERNAL_VERSION,
      'process.env.DEVTOOLS_PACKAGE': `"react-devtools-extensions"`,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.EDITOR_URL': EDITOR_URL != null ? `"${EDITOR_URL}"` : null,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
      'process.env.LOGGING_URL': `"${LOGGING_URL}"`,
      'process.env.NODE_ENV': `"${NODE_ENV}"`,
    }),
    new Webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      include: 'installHook.js',
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
      shouldIgnoreSource: (assetName, _source) => {
        if (__DEV__) {
          // Don't ignore list anything in DEV build for debugging purposes
          return false;
        }

        const contentScriptNamesToIgnoreList = [
          // This is where we override console
          'installHook',
        ];

        return contentScriptNamesToIgnoreList.some(ignoreListName =>
          assetName.startsWith(ignoreListName),
        );
      },
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
