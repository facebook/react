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

const fs = require('fs').promises;
const compress = require('compression');
const chalk = require('chalk');
const express = require('express');
const http = require('http');

const {renderToPipeableStream} = require('react-dom/server');
const {createFromNodeStream} = require('react-server-dom-webpack/client');

const app = express();

app.use(compress());

if (process.env.NODE_ENV === 'development') {
  // In development we host the Webpack server for live bundling.
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const paths = require('../config/paths');
  const configFactory = require('../config/webpack.config');
  const getClientEnvironment = require('../config/env');

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const config = configFactory('development');
  const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
  const appName = require(paths.appPackageJson).name;

  // Create a webpack compiler that is configured with custom messages.
  const compiler = webpack(config);
  app.use(
    webpackMiddleware(compiler, {
      publicPath: paths.publicUrlOrPath.slice(0, -1),
      serverSideRender: true,
    })
  );
  app.use(webpackHotMiddleware(compiler));
}

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

  if (req.accepts('text/html')) {
    try {
      const rscResponse = await promiseForData;

      let virtualFs;
      let buildPath;
      if (process.env.NODE_ENV === 'development') {
        const {devMiddleware} = res.locals.webpack;
        virtualFs = devMiddleware.outputFileSystem.promises;
        buildPath = devMiddleware.stats.toJson().outputPath;
      } else {
        virtualFs = fs;
        buildPath = path.join(__dirname, '../build/');
      }
      // Read the module map from the virtual file system.
      const moduleMap = JSON.parse(
        await virtualFs.readFile(
          path.join(buildPath, 'react-ssr-manifest.json'),
          'utf8'
        )
      );
      // Read the entrypoints containing the initial JS to bootstrap everything.
      // For other pages, the chunks in the RSC payload are enough.
      const mainJSChunks = JSON.parse(
        await virtualFs.readFile(
          path.join(buildPath, 'entrypoint-manifest.json'),
          'utf8'
        )
      ).main.js;
      // For HTML, we're a "client" emulator that runs the client code,
      // so we start by consuming the RSC payload. This needs a module
      // map that reverse engineers the client-side path to the SSR path.
      const root = await createFromNodeStream(rscResponse, moduleMap);
      // Render it into HTML by resolving the client components
      res.set('Content-type', 'text/html');
      const {pipe} = renderToPipeableStream(root, {
        bootstrapScripts: mainJSChunks,
      });
      pipe(res);
    } catch (e) {
      console.error(`Failed to SSR: ${e.stack}`);
      res.statusCode = 500;
      res.end();
    }
  } else {
    try {
      const rscResponse = await promiseForData;
      // For other request, we pass-through the RSC payload.
      res.set('Content-type', 'text/x-component');
      rscResponse.on('data', data => {
        res.write(data);
        res.flush();
      });
      rscResponse.on('end', data => {
        res.end();
      });
    } catch (e) {
      console.error(`Failed to proxy request: ${e.stack}`);
      res.statusCode = 500;
      res.end();
    }
  }
});

if (process.env.NODE_ENV === 'development') {
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
