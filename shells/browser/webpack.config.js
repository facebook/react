const { readFileSync } = require('fs');
const { resolve } = require('path');
const webpack = require('webpack');

const __DEV__ = process.env.NODE_ENV !== 'production';

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
  plugins: __DEV__
    ? []
    : [
        // Ensure we get production React
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
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
