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

if (typeof fetch === 'undefined') {
  // Patch fetch for earlier Node versions.
  global.fetch = require('undici').fetch;
}

const express = require('express');
const bodyParser = require('body-parser');
const busboy = require('busboy');
const app = express();
const compress = require('compression');
const {Readable} = require('node:stream');

app.use(compress());

// Application

const {readFile} = require('fs').promises;

const React = require('react');

async function renderApp(res, returnValue) {
  const {renderToPipeableStream} = await import(
    'react-server-dom-webpack/server'
  );
  // const m = require('../src/App.js');
  const m = await import('../src/App.js');

  let moduleMap;
  let mainCSSChunks;
  if (process.env.NODE_ENV === 'development') {
    // Read the module map from the HMR server in development.
    moduleMap = await (
      await fetch('http://localhost:3000/react-client-manifest.json')
    ).json();
    mainCSSChunks = (
      await (
        await fetch('http://localhost:3000/entrypoint-manifest.json')
      ).json()
    ).main.css;
  } else {
    // Read the module map from the static build in production.
    moduleMap = JSON.parse(
      await readFile(
        path.resolve(__dirname, `../build/react-client-manifest.json`),
        'utf8'
      )
    );
    mainCSSChunks = JSON.parse(
      await readFile(
        path.resolve(__dirname, `../build/entrypoint-manifest.json`),
        'utf8'
      )
    ).main.css;
  }
  const App = m.default.default || m.default;
  const root = [
    // Prepend the App's tree with stylesheets required for this entrypoint.
    mainCSSChunks.map(filename =>
      React.createElement('link', {
        rel: 'stylesheet',
        href: filename,
        precedence: 'default',
      })
    ),
    React.createElement(App),
  ];
  // For client-invoked server actions we refresh the tree and return a return value.
  const payload = returnValue ? {returnValue, root} : root;
  const {pipe} = renderToPipeableStream(payload, moduleMap);
  pipe(res);
}

app.get('/', async function (req, res) {
  await renderApp(res, null);
});

app.post('/', bodyParser.text(), async function (req, res) {
  const {
    renderToPipeableStream,
    decodeReply,
    decodeReplyFromBusboy,
    decodeAction,
  } = await import('react-server-dom-webpack/server');
  const serverReference = req.get('rsc-action');
  if (serverReference) {
    // This is the client-side case
    const [filepath, name] = serverReference.split('#');
    const action = (await import(filepath))[name];
    // Validate that this is actually a function we intended to expose and
    // not the client trying to invoke arbitrary functions. In a real app,
    // you'd have a manifest verifying this before even importing it.
    if (action.$$typeof !== Symbol.for('react.server.reference')) {
      throw new Error('Invalid action');
    }

    let args;
    if (req.is('multipart/form-data')) {
      // Use busboy to streamingly parse the reply from form-data.
      const bb = busboy({headers: req.headers});
      const reply = decodeReplyFromBusboy(bb);
      req.pipe(bb);
      args = await reply;
    } else {
      args = await decodeReply(req.body);
    }
    const result = action.apply(null, args);
    try {
      // Wait for any mutations
      await result;
    } catch (x) {
      // We handle the error on the client
    }
    // Refresh the client and return the value
    renderApp(res, result);
  } else {
    // This is the progressive enhancement case
    const UndiciRequest = require('undici').Request;
    const fakeRequest = new UndiciRequest('http://localhost', {
      method: 'POST',
      headers: {'Content-Type': req.headers['content-type']},
      body: Readable.toWeb(req),
      duplex: 'half',
    });
    const formData = await fakeRequest.formData();
    const action = await decodeAction(formData);
    try {
      // Wait for any mutations
      await action();
    } catch (x) {
      const {setServerState} = await import('../src/ServerState.js');
      setServerState('Error: ' + x.message);
    }
    renderApp(res, null);
  }
});

app.get('/todos', function (req, res) {
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
