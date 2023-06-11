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
const compress = require('compression');
const {Readable} = require('node:stream');
const {readFile} = require('fs').promises;
const React = require('react');

async function createApp() {
  // Application
  const app = express();
  app.use(compress());

  const moduleBasePath = new URL('../src', url.pathToFileURL(__filename)).href;

  let loadModule;
  if (process.env.NODE_ENV === 'development') {
    const vite = await import('vite');
    const {default: reactRefresh} = await import('@vitejs/plugin-react');
    const {default: reactServer} = await import('react-server-dom-vite/plugin');
    const viteServer = await vite.createServer({
      appType: 'custom',
      server: {middlewareMode: true, hmr: {port: 9898}},
      resolve: {
        conditions: ['node', 'import', 'react-server', process.env.NODE_ENV],
      },
      plugins: [
        reactServer(),
        reactRefresh(),
        {
          name: 'react-server-dom-vite:react-refresh',
          handleHotUpdate({file}) {
            // clear vite module cache so when its imported again, we will
            fetch(`http://localhost:3000/__refresh`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({file}),
            })
              .then(() => {})
              .catch(err => console.error(err));
          },
        },
      ],
      ssr: {
        noExternal: true,
        external: ['react', 'react-dom', 'react-server-dom-vite'],
      },
    });

    globalThis.__vite_module_cache__ = new Map();
    globalThis.__vite_require__ = id => {
      return viteServer.ssrLoadModule(id);
    };

    loadModule = async entry => {
      return await viteServer.ssrLoadModule(
        path.resolve(viteServer.config.root, entry)
      );
    };
  } else {
    const reactServerManifest = JSON.parse(
      await readFile('build/react-server/manifest.json', 'utf8')
    );

    loadModule = async entry => {
      const id = reactServerManifest[entry];
      if (id) {
        return await import(
          path.join(process.cwd(), 'build/react-server', id.file)
        );
      } else {
        // this is probably a server action module
        return await import(
          path.join(process.cwd(), 'build/react-server', entry + '.js')
        );
      }
    };

    globalThis.__vite_module_cache__ = new Map();
    globalThis.__vite_require__ = id => {
      return import(
        path.join(process.cwd(), 'build', 'react-server', id + '.js')
      );
    };
  }

  async function renderApp(res, returnValue) {
    const {renderToPipeableStream} = await import(
      'react-server-dom-vite/server'
    );

    const {default: App} = await loadModule('src/App.jsx');
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
    } = await import('react-server-dom-vite/server');
    const serverReference = req.get('rsc-action');
    if (serverReference) {
      // This is the client-side case
      const [filepath, name] = JSON.parse(serverReference);
      const action = (await loadModule(filepath))[name];
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
}

createApp();
