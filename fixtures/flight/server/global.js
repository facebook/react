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

const http = require('http');

app.use(compress());

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      resolve(res);
    });
    req.on('error', e => {
      reject(e);
    });
    body.pipe(req);
  });
}

app.all('/', async function (req, res, next) {
  if (req.accepts('text/html')) {
    // Pass-through to the html file
    next();
    return;
  }

  // Proxy the request to the regional server.
  const proxiedHeaders = {
    'X-Forwarded-Host': req.hostname,
    'X-Forwarded-For': req.ips,
    'X-Forwarded-Port': 3000,
    'X-Forwarded-Proto': req.protocol,
  };
  // Proxy other headers as desired.
  if (req.get('rsc-action')) {
    proxiedHeaders['Content-type'] = req.get('Content-type');
    proxiedHeaders['rsc-action'] = req.get('rsc-action');
  }

  const promiseForData = request(
    {
      host: '127.0.0.1',
      port: 3001,
      method: req.method,
      path: '/',
      headers: proxiedHeaders,
    },
    req
  );

  try {
    const rscResponse = await promiseForData;
    res.set('Content-type', 'text/x-component');
    rscResponse.pipe(res);
  } catch (e) {
    console.error(`Failed to proxy request: ${e.stack}`);
    res.statusCode = 500;
    res.end();
  }
});

if (process.env.NODE_ENV === 'development') {
  // In development we host the Webpack server for live bundling.
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
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
  app.use(
    webpackMiddleware(compiler, {
      writeToDisk: filePath => {
        return /(react-client-manifest|react-ssr-manifest)\.json$/.test(
          filePath
        );
      },
      publicPath: paths.publicUrlOrPath.slice(0, -1),
    })
  );
  app.use(
    webpackHotMiddleware(compiler, {
      /* Options */
    })
  );
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
