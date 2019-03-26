const { readFileSync } = require('fs');
const { resolve } = require('path');
const { DefinePlugin } = require('webpack');

const NODE_ENV = process.env.NODE_ENV;
const __DEV__ = NODE_ENV !== 'production';

const DEVTOOLS_VERSION = JSON.parse(
  readFileSync(resolve(__dirname, '../../../package.json'))
).version;

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : false,
  entry: {
    background: './src/background.js',
    contentScript: './src/contentScript.js',
    inject: './src/GlobalHook.js',
    main: './src/main.js',
    panel: './src/panel.js',
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
  },
  resolve: {
    alias: {
      src: resolve(__dirname, '../../../src'),
    },
  },
  plugins: [
    new DefinePlugin({
      __DEV__: false,
      'process.env.DEVTOOLS_VERSION': `"${DEVTOOLS_VERSION}"`,
      'process.env.NODE_ENV': `"${NODE_ENV}"`,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: JSON.parse(
          readFileSync(resolve(__dirname, '../../../.babelrc'))
        ),
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
