var webpack = require('webpack');
var path = require('path');

module.exports = {
  context: __dirname,
  entry: './app.js',
  module: {
    loaders: [
      {
        loader: require.resolve('babel-loader'),
        test: /\.js$/,
        exclude: /node_modules/,
        query: {
          presets: [
            require.resolve('babel-preset-es2015'),
            require.resolve('babel-preset-react'),
          ],
        },
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    })
  ],
  resolve: {
    alias: {
      react: require.resolve('react')
    }
  }
};
