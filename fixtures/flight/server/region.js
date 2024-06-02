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
  presets: ['@babel/preset-react'],
  plugins: ['@babel/transform-modules-commonjs'],
  sourceMaps: process.env.NODE_ENV === 'development' ? 'inline' : false,
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

const nodeModule = require('node:module');

app.use(compress());

// Application

const {readFile} = require('fs').promises;

const React = require('react');

async function renderApp(res, returnValue, formState) {
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
  const root = React.createElement(
    React.Fragment,
    null,
    // Prepend the App's tree with stylesheets required for this entrypoint.
    mainCSSChunks.map(filename =>
      React.createElement('link', {
        rel: 'stylesheet',
        href: filename,
        precedence: 'default',
        key: filename,
      })
    ),
    React.createElement(App)
  );
  // For client-invoked server actions we refresh the tree and return a return value.
  const payload = {root, returnValue, formState};
  const {pipe} = renderToPipeableStream(payload, moduleMap);
  pipe(res);
}

app.get('/', async function (req, res) {
  await renderApp(res, null, null);
});

app.post('/', bodyParser.text(), async function (req, res) {
  const {decodeReply, decodeReplyFromBusboy, decodeAction, decodeFormState} =
    await import('react-server-dom-webpack/server');
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
    renderApp(res, result, null);
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
      const result = await action();
      const formState = decodeFormState(result, formData);
      renderApp(res, null, formState);
    } catch (x) {
      const {setServerState} = await import('../src/ServerState.js');
      setServerState('Error: ' + x.message);
      renderApp(res, null, null);
    }
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

if (process.env.NODE_ENV === 'development') {
  const rootDir = path.resolve(__dirname, '../');

  app.get('/source-maps', async function (req, res, next) {
    try {
      res.set('Content-type', 'application/json');
      let requestedFilePath = req.query.name;

      if (requestedFilePath.startsWith('file://')) {
        requestedFilePath = requestedFilePath.slice(7);
      }

      const relativePath = path.relative(rootDir, requestedFilePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        // This is outside the root directory of the app. Forbid it to be served.
        res.status = 403;
        res.write('{}');
        res.end();
        return;
      }

      const sourceMap = nodeModule.findSourceMap(requestedFilePath);
      let map;
      // There are two ways to return a source map depending on what we observe in error.stack.
      // A real app will have a similar choice to make for which strategy to pick.
      if (!sourceMap || Error.prepareStackTrace === undefined) {
        // When --enable-source-maps is enabled, the error.stack that we use to track
        // stacks will have had the source map already applied so it's pointing to the
        // original source. We return a blank source map that just maps everything to
        // the original source in this case.
        const sourceContent = await readFile(requestedFilePath, 'utf8');
        const lines = sourceContent.split('\n').length;
        map = {
          version: 3,
          sources: [requestedFilePath],
          sourcesContent: [sourceContent],
          // Note: This approach to mapping each line only lets you jump to each line
          // not jump to a column within a line. To do that, you need a proper source map
          // generated for each parsed segment or add a segment for each column.
          mappings: 'AAAA' + ';AACA'.repeat(lines - 1),
          sourceRoot: '',
        };
      } else {
        // If something has overridden prepareStackTrace it is likely not getting the
        // natively applied source mapping to error.stack and so the line will point to
        // the compiled output similar to how a browser works.
        // E.g. ironically this can happen with the source-map-support library that is
        // auto-invoked by @babel/register if external source maps are generated.
        // In this case we just use the source map that the native source mapping would
        // have used.
        map = sourceMap.payload;
      }
      res.write(JSON.stringify(map));
      res.end();
    } catch (x) {
      res.status = 500;
      res.write('{}');
      res.end();
      console.error(x);
    }
  });
}

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
