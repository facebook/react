const {resolve} = require('path');
const {DefinePlugin} = require('webpack');
const {
  GITHUB_URL,
  getVersionString,
} = require('react-devtools-extensions/utils');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  console.error('NODE_ENV not set');
  process.exit(1);
}

const builtModulesDir = resolve(__dirname, '..', '..', 'build', 'node_modules');

const __DEV__ = NODE_ENV === 'development';

const DEVTOOLS_VERSION = getVersionString();

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  devtool: __DEV__ ? 'cheap-module-eval-source-map' : false,
  target: 'electron-main',
  entry: {
    standalone: './src/standalone.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    alias: {
      react: resolve(builtModulesDir, 'react'),
      'react-dom': resolve(builtModulesDir, 'react-dom'),
      'react-debug-tools': resolve(builtModulesDir, 'react-debug-tools'),
      'react-is': resolve(builtModulesDir, 'react-is'),
      scheduler: resolve(builtModulesDir, 'scheduler'),
    },
  },
  node: {
    // Don't replace __dirname!
    // This would break the standalone DevTools ability to load the backend.
    // see https://github.com/facebook/react-devtools/issues/1269
    __dirname: false,
  },
  plugins: [
    new DefinePlugin({
      __DEV__: false,
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
              // WARNING It's important that we disable CSS source maps for production builds.
              // This causes style-loader to insert styles via a <style> tag rather than URL.createObjectURL,
              // which in turn avoids a nasty Electron/Chromium bug that breaks DevTools in Nuclide.
              // (Calls to URL.createObjectURL seem to crash the webview process.)
              sourceMap: __DEV__,
              modules: true,
              localIdentName: '[local]___[hash:base64:5]',
            },
          },
        ],
      },
    ],
  },
};
