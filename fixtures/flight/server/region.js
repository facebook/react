'use strict';

// This is a server to host data-local resources like databases and RSC

const path = require('path');

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

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const compress = require('compression');

app.use(compress());

// Application

const {readFile} = require('fs').promises;

const React = require('react');

app.get('/', async function (req, res) {
  const {renderToPipeableStream} = await import(
    'react-server-dom-webpack/server'
  );
  // const m = require('../src/App.js');
  const m = await import('../src/App.js');
  const dist = process.env.NODE_ENV === 'development' ? 'dist' : 'build';
  const data = await readFile(
    path.resolve(__dirname, `../${dist}/react-client-manifest.json`),
    'utf8'
  );
  const App = m.default.default || m.default;
  res.setHeader('Access-Control-Allow-Origin', '*');
  const moduleMap = JSON.parse(data);
  const {pipe} = renderToPipeableStream(React.createElement(App), moduleMap);
  pipe(res);
});

app.options('/', function (req, res) {
  res.setHeader('Allow', 'Allow: GET,HEAD,POST');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'rsc-action');
  res.end();
});

app.post('/', bodyParser.text(), async function (req, res) {
  const {renderToPipeableStream} = await import(
    'react-server-dom-webpack/server'
  );
  const serverReference = JSON.parse(req.get('rsc-action'));
  const {filepath, name} = serverReference;
  const action = (await import(filepath))[name];
  // Validate that this is actually a function we intended to expose and
  // not the client trying to invoke arbitrary functions. In a real app,
  // you'd have a manifest verifying this before even importing it.
  if (action.$$typeof !== Symbol.for('react.server.reference')) {
    throw new Error('Invalid action');
  }

  const args = JSON.parse(req.body);
  const result = action.apply(null, args);

  res.setHeader('Access-Control-Allow-Origin', '*');
  const {pipe} = renderToPipeableStream(result, {});
  pipe(res);
});

app.get('/todos', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json([
    {
      id: 1,
      text: 'Shave yaks',
    },
    {
      id: 2,
      text: 'Eat kale',
    },
  ]);
});

app.listen(3001, () => {
  console.log('Regional Flight Server listening on port 3001...');
});

app.on('error', function (error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error('port 3001 requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error('Port 3001 is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
