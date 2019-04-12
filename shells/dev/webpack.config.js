const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { DefinePlugin } = require('webpack');

const __DEV__ = process.env.NODE_ENV !== 'production';

// TODO potentially replac this with an fb.me URL (if it can forward the query params)
const GITHUB_URL = execSync('git remote get-url origin')
  .toString()
  .trim()
  .replace(':', '/')
  .replace('git@', 'https://')
  .replace('.git', '');

const DEVTOOLS_VERSION = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'))
).version;

// TODO Share Webpack configs like alias

module.exports = {
  mode: 'development',
  devtool: false,
  entry: {
    app: './app/index.js',
    backend: './src/backend.js',
    devtools: './src/devtools.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },
  resolve: {
    alias: {
      src: resolve(__dirname, '../../src'),
    },
  },
  plugins: [
    new DefinePlugin({
      __DEV__: __DEV__,
      'process.env.GITHUB_URL': `"${GITHUB_URL}"`,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: JSON.parse(readFileSync(resolve(__dirname, '../../.babelrc'))),
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
