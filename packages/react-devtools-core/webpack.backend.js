const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const {
  DARK_MODE_DIMMED_WARNING_COLOR,
  DARK_MODE_DIMMED_ERROR_COLOR,
  DARK_MODE_DIMMED_LOG_COLOR,
  LIGHT_MODE_DIMMED_WARNING_COLOR,
  LIGHT_MODE_DIMMED_ERROR_COLOR,
  LIGHT_MODE_DIMMED_LOG_COLOR,
  GITHUB_URL,
  getVersionString,
} = require('react-devtools-extensions/utils');
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

const DEVTOOLS_VERSION = getVersionString();

const featureFlagTarget = process.env.FEATURE_FLAG_TARGET || 'core/backend-oss';

// This targets RN/Hermes.
process.env.BABEL_CONFIG_ADDITIONAL_TARGETS = JSON.stringify({
  ie: '11',
});

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : 'source-map',
  entry: {
    backend: './src/backend.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',

    // This name is important; standalone references it in order to connect.
    library: 'ReactDevToolsBackend',
    libraryTarget: 'umd',
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
  node: {
    fs: 'empty',
  },
  plugins: [
    new DefinePlugin({
      __DEV__,
      __EXPERIMENTAL__: true,
      __EXTENSION__: false,
      __PROFILE__: false,
      __TEST__: NODE_ENV === 'test',
      'process.env.DEVTOOLS_PACKAGE': `"react-devtools-core"`,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
      'process.env.DARK_MODE_DIMMED_WARNING_COLOR': `"${DARK_MODE_DIMMED_WARNING_COLOR}"`,
      'process.env.DARK_MODE_DIMMED_ERROR_COLOR': `"${DARK_MODE_DIMMED_ERROR_COLOR}"`,
      'process.env.DARK_MODE_DIMMED_LOG_COLOR': `"${DARK_MODE_DIMMED_LOG_COLOR}"`,
      'process.env.LIGHT_MODE_DIMMED_WARNING_COLOR': `"${LIGHT_MODE_DIMMED_WARNING_COLOR}"`,
      'process.env.LIGHT_MODE_DIMMED_ERROR_COLOR': `"${LIGHT_MODE_DIMMED_ERROR_COLOR}"`,
      'process.env.LIGHT_MODE_DIMMED_LOG_COLOR': `"${LIGHT_MODE_DIMMED_LOG_COLOR}"`,
    }),
  ],
  optimization: {
    minimize: false,
  },
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
