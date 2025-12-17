var webpack = require('webpack');

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
            require.resolve('@babel/preset-env'),
            require.resolve('@babel/preset-react'),
          ],
          plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
  resolve: {
    alias: {
      react: require.resolve('react'),
    },
  },
};
