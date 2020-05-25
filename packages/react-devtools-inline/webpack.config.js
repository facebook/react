const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const {
  GITHUB_URL,
  getVersionString,
} = require('react-devtools-extensions/utils');
const {
  validateWebpackTarget,
  resolveTargetFlags,
} = require('react-devtools-shared/config/resolveTarget');

const TARGET = process.env.TARGET;
validateWebpackTarget(TARGET);

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const __DEV__ = NODE_ENV === 'development';

const DEVTOOLS_VERSION = getVersionString();

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'eval-cheap-source-map' : 'source-map',
  entry: {
    backend: './src/backend.js',
    frontend: './src/frontend.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'commonjs2',
  },
  externals: {
    react: 'react',
    // TODO: Once this package is published, remove the external
    // 'react-debug-tools': 'react-debug-tools',
    'react-dom': 'react-dom',
    'react-is': 'react-is',
    scheduler: 'scheduler',
    'react-devtools-target-flags': resolveTargetFlags(resolve, TARGET),
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new DefinePlugin({
      __DEV__,
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
