'use strict';

// This is a server to host data-local resources like databases and RSC

const path = require('path');
const url = require('url');

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

const moduleBasePath = new URL('../src', url.pathToFileURL(__filename)).href;

async function renderApp(res, returnValue) {
  const {renderToPipeableStream} = await import('react-server-dom-esm/server');
  const m = await import('../src/App.js');

  const App = m.default;
  const root = React.createElement(App);
  // For client-invoked server actions we refresh the tree and return a return value.
  const payload = returnValue ? {returnValue, root} : root;
  const {pipe} = renderToPipeableStream(payload, moduleBasePath);
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
  } = await import('react-server-dom-esm/server');
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
      const reply = decodeReplyFromBusboy(bb, moduleBasePath);
      req.pipe(bb);
      args = await reply;
    } else {
      args = await decodeReply(req.body, moduleBasePath);
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
    const action = await decodeAction(formData, moduleBasePath);
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
