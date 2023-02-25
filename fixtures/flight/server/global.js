'use strict';

// This is a server to host CDN distributed resources like Webpack bundles and SSR

const path = require('path');

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = process.env.NODE_ENV;

const register = require('react-server-dom-webpack/node-register');
register();

const babelRegister = require('@babel/register');
babelRegister({
  babelrc: false,
  ignore: [
    /\/(build|node_modules)\//,
    function (file) {
      if ((path.dirname(file) + '/').startsWith(__dirname + '/')) {
        // Ignore everything in this folder
        // because it's a mix of CJS and ESM
        // and working with raw code is easier.
        return true;
      }
      return false;
    },
  ],
  presets: ['react-app'],
  plugins: ['@babel/transform-modules-commonjs'],
});

// Ensure environment variables are read.
require('../config/env');

const fs = require('fs');
const compress = require('compression');
const chalk = require('chalk');
const express = require('express');
const app = express();

app.use(compress());

if (process.env.NODE_ENV === 'development') {
  // In development we host the Webpack server for live bundling.
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const paths = require('../config/paths');
  const configFactory = require('../config/webpack.config');
  const getClientEnvironment = require('../config/env');

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const HOST = '0.0.0.0';
  const PORT = 3000;

  const config = configFactory('development');
  const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
  const appName = require(paths.appPackageJson).name;

  // Create a webpack compiler that is configured with custom messages.
  const compiler = webpack(config);
  const devMiddleware = {
    writeToDisk: filePath => {
      return /(react-client-manifest|react-ssr-manifest)\.json$/.test(filePath);
    },
    publicPath: paths.publicUrlOrPath.slice(0, -1),
  };
  app.use(webpackMiddleware(compiler, devMiddleware));
  app.use(express.static('public'));
} else {
  // In production we host the static build output.
  app.use(express.static('build'));
}

app.listen(3000, () => {
  console.log('Global Fizz/Webpack Server listening on port 3000...');
});

app.on('error', function (error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error('port 3000 requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error('Port 3000 is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
