'use strict';

require('@babel/register')({
  presets: [['@babel/preset-react', {runtime: 'automatic'}]],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
  only: [/\/src\//],
});

const path = require('path');
const url = require('url');
const fs = require('fs');
const {PassThrough, Writable} = require('stream');

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {mode: 'classical', app: 'sync', items: 200};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && args[i + 1]) opts.mode = args[++i];
    if (args[i] === '--app' && args[i + 1]) opts.app = args[++i];
    if (args[i] === '--items' && args[i + 1]) opts.items = parseInt(args[++i], 10);
  }
  return opts;
}

const opts = parseArgs();

// ---------------------------------------------------------------------------
// Manifest setup
// ---------------------------------------------------------------------------

const clientModules = {};
const clientManifest = {};
const ssrModuleMap = {};
let moduleIdx = 0;

function registerClientModule(modulePath) {
  const id = String(moduleIdx++);
  const chunkId = 'chunk-' + id;
  const absPath = path.resolve(__dirname, modulePath);
  const actualExports = require(absPath);
  clientModules[id] = actualExports;

  const href = url.pathToFileURL(absPath).href;
  clientManifest[href] = {id, chunks: [chunkId, absPath], name: '*'};
  ssrModuleMap[id] = {'*': {id, chunks: [chunkId, absPath], name: '*'}};
}

const srcDirs = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'src/components'),
];
for (const dir of srcDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;
    const filePath = path.join(dir, file);
    const source = fs.readFileSync(filePath, 'utf-8');
    if (
      source.trimStart().startsWith("'use client'") ||
      source.trimStart().startsWith('"use client"')
    ) {
      registerClientModule(filePath);
    }
  }
}

global.__webpack_require__ = function (id) {
  if (clientModules[id]) {
    return clientModules[id];
  }
  throw new Error('Unknown module: ' + id);
};
global.__webpack_chunk_load__ = function (chunkId) {
  return new Promise(function (resolve) {
    setImmediate(resolve);
  });
};

const ssrManifest = {
  moduleMap: ssrModuleMap,
  moduleLoading: null,
  serverModuleMap: null,
};

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderClassical(AppComponent, itemCount) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');

  return new Promise(function (resolve, reject) {
    const element = React.createElement(AppComponent, {itemCount});
    const {pipe} = renderToPipeableStream(element, {
      onAllReady() {
        const chunks = [];
        const writable = new Writable({
          write(chunk, _encoding, cb) {
            chunks.push(chunk);
            cb();
          },
          final(cb) {
            resolve(Buffer.concat(chunks).toString('utf-8'));
            cb();
          },
        });
        pipe(writable);
      },
      onError: reject,
    });
  });
}

function renderFlight(rscBundle, AppComponent, itemCount) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');
  const {createFromNodeStream} = require('react-server-dom-webpack/client');

  const {pipe: rscPipe} = rscBundle(clientManifest, AppComponent, itemCount);
  const flightStream = new PassThrough();
  rscPipe(flightStream);

  return new Promise(function (resolve, reject) {
    let cachedResult;
    function Root() {
      if (!cachedResult) {
        cachedResult = createFromNodeStream(flightStream, ssrManifest);
      }
      return React.use(cachedResult);
    }

    const {pipe} = renderToPipeableStream(React.createElement(Root), {
      onAllReady() {
        const chunks = [];
        const writable = new Writable({
          write(chunk, _encoding, cb) {
            chunks.push(chunk);
            cb();
          },
          final(cb) {
            resolve(Buffer.concat(chunks).toString('utf-8'));
            cb();
          },
        });
        pipe(writable);
      },
      onError: reject,
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const App = require('./src/App.js').default;
  const AppAsync = require('./src/AppAsync.js').default;

  const AppComponent = opts.app === 'async' ? AppAsync : App;

  let renderFn;
  if (opts.mode === 'flight') {
    const rscBundle = require('./build/rsc-bundle.js').default;
    const rscApps = require('./build/rsc-bundle.js');
    const RscAppComponent =
      opts.app === 'async' ? rscApps.AppAsync : rscApps.App;
    renderFn = () => renderFlight(rscBundle, RscAppComponent, opts.items);
  } else {
    renderFn = () => renderClassical(AppComponent, opts.items);
  }

  if (typeof globalThis.gc === 'function') globalThis.gc();

  const start = performance.now();
  await renderFn();
  const elapsed = performance.now() - start;

  process.stdout.write(String(elapsed));
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
