'use strict';

// This is a server to host CDN distributed resources like module source files and SSR

const path = require('path');
const url = require('url');

const fs = require('fs').promises;
const compress = require('compression');
const chalk = require('chalk');
const express = require('express');
const http = require('http');
const vite = require('vite');

const {renderToPipeableStream} = require('react-dom/server');
const {createFromNodeStream} = require('react-server-dom-vite/client');

const moduleBasePath = new URL('../src', url.pathToFileURL(__filename)).href;

async function createApp() {
  const app = express();

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

  let getClientAsset;

  if (process.env.NODE_ENV === 'development') {
    const vite = await import('vite');
    const {default: reactRefresh} = await import('@vitejs/plugin-react');
    const viteServer = await vite.createServer({
      appType: 'custom',
      server: {middlewareMode: true},
      plugins: [
        reactRefresh(),
        {
          name: 'react-server-dom-vite:react-refresh',
          handleHotUpdate({file}) {
            // clear vite module cache so when its imported again, we will
            // get the new version
            globalThis.__vite_module_cache__.delete(file);
          },
        },
      ],
      ssr: {
        external: ['react', 'react-dom', 'react-server-dom-vite'],
      },
    });

    globalThis.__vite_module_cache__ = new Map();
    globalThis.__vite_preload__ = metadata => {
      const existingPromise = __vite_module_cache__.get(metadata.specifier);
      if (existingPromise) {
        if (existingPromise.status === 'fulfilled') {
          return null;
        }
        return existingPromise;
      } else {
        const modulePromise = viteServer.ssrLoadModule(metadata.specifier);
        modulePromise.then(
          value => {
            const fulfilledThenable = modulePromise;
            fulfilledThenable.status = 'fulfilled';
            fulfilledThenable.value = value;
          },
          reason => {
            const rejectedThenable = modulePromise;
            rejectedThenable.status = 'rejected';
            rejectedThenable.reason = reason;
          }
        );
        __vite_module_cache__.set(metadata.specifier, modulePromise);
        return modulePromise;
      }
    };

    globalThis.__vite_require__ = metadata => {
      let moduleExports;
      // We assume that preloadModule has been called before, which
      // should have added something to the module cache.
      const promise = __vite_module_cache__.get(metadata.specifier);
      if (promise) {
        if (promise.status === 'fulfilled') {
          moduleExports = promise.value;
        } else {
          throw promise.reason;
        }
        return moduleExports[metadata.name];
      } else {
        throw new Error('Module not found in cache: ' + id);
      }
    };

    app.use('/__refresh', (req, res) => {
      viteServer.ws.send('reload-rsc', {});
    });

    app.use(viteServer.middlewares);

    getClientAsset = id => {
      return path.join(viteServer.config.root, id);
    };
  } else {
    globalThis.__vite_module_cache__ = new Map();
    globalThis.__vite_preload__ = metadata => {
      return null;
    };

    globalThis.__vite_require__ = metadata => {
      const module = require(path.join(
        process.cwd(),
        'build',
        'server',
        metadata.specifier + '.cjs'
      ));

      if (metadata.name === 'default') {
        return module;
      }
      return module[metadata.name];
    };

    app.use(express.static('build/static'));

    const clientManifest = JSON.parse(
      await fs.readFile(path.join('build', 'static', 'manifest.json'), 'utf-8')
    );
    getClientAsset = id => {
      return clientManifest[id].file;
    };
  }

  app.all('/', async function (req, res) {
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
    } else if (req.get('Content-type')) {
      proxiedHeaders['Content-type'] = req.get('Content-type');
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
        const moduleBaseURL = '/src';
        // For HTML, we're a "client" emulator that runs the client code,
        // so we start by consuming the RSC payload. This needs the local file path
        // to load the source files from as well as the URL path for preloads.
        const root = await createFromNodeStream(
          rscResponse,
          new Proxy(
            {},
            {
              get(t, p) {
                console.log(t, p);
              },
            }
          ),
          moduleBaseURL
        );
        // Render it into HTML by resolving the client components
        res.set('Content-type', 'text/html');
        const {pipe} = renderToPipeableStream(root, {
          bootstrapModules: [getClientAsset('src/index.js')],
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

  app.listen(3000, () => {
    console.log('Global Fizz/Webpack Server listening on port 3000...');
  });
}

createApp();
