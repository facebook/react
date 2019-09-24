const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const {
  getGitHubURL,
  getVersionString,
} = require('react-devtools-extensions/utils');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const __DEV__ = NODE_ENV === 'development';
const __PRERELEASE__ = process.env.PRERELEASE === 'true';

const GITHUB_URL = getGitHubURL();
const DEVTOOLS_VERSION = getVersionString();

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: false,
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

    // Feature flags used for early testing features within FB hosted version of extension:
    'react-devtools-feature-flags': resolve(
      __dirname,
      '../react-devtools-shared/src/config',
      __PRERELEASE__
        ? 'DevToolsFeatureFlags.prerelease'
        : 'DevToolsFeatureFlags.stable',
    ),
  },
  plugins: [
    new DefinePlugin({
      __DEV__,
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
