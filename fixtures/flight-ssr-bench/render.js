'use strict';

require('@babel/register')({
  presets: [['@babel/preset-react', {runtime: 'automatic'}]],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
  only: [/\/src\//],
});

const path = require('path');
const url = require('url');
const fs = require('fs');
const webpack = require('webpack');
const {PassThrough, Writable} = require('stream');

// ---------------------------------------------------------------------------
// Manifest setup (WebpackMock pattern)
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

// Auto-register all 'use client' components by scanning src/
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
    if (source.trimStart().startsWith("'use client'") || source.trimStart().startsWith('"use client"')) {
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
// Build
// ---------------------------------------------------------------------------

function build() {
  const config = require('./webpack.config');
  return new Promise(function (resolve, reject) {
    webpack(config, function (err, stats) {
      if (err) {
        reject(err);
        return;
      }
      if (stats.hasErrors()) {
        reject(new Error(stats.toString({errors: true})));
        return;
      }
      console.log(
        stats.toString({colors: true, modules: false, entrypoints: false})
      );
      resolve();
    });
  });
}

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

function renderFlight(renderRSCNode, AppComponent, itemCount) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');
  const {createFromNodeStream} = require('react-server-dom-webpack/client');
  const {Transform} = require('stream');

  const {pipe: rscPipe} = renderRSCNode(clientManifest, AppComponent, itemCount);
  const trunk = new PassThrough();
  const forSsr = new PassThrough();
  const forInline = new PassThrough();
  trunk.pipe(forSsr);
  trunk.pipe(forInline);

  const rscPayloadChunks = [];
  let flightScripts = '';
  forInline.on('data', function (chunk) {
    rscPayloadChunks.push(chunk);
    const escaped = JSON.stringify(chunk.toString())
      .replace(/<!--/g, '<\\!--')
      .replace(/<\/(script)/gi, '</\\$1');
    flightScripts +=
      '<script>(self.__FLIGHT_DATA||=[]).push(' + escaped + ')</script>';
  });

  rscPipe(trunk);

  return new Promise(function (resolve, reject) {
    let cachedResult;
    function Root() {
      if (!cachedResult) {
        cachedResult = createFromNodeStream(forSsr, ssrManifest);
      }
      return React.use(cachedResult);
    }

    const {pipe} = renderToPipeableStream(React.createElement(Root), {
      onShellReady() {
        const htmlChunks = [];
        const injector = new Transform({
          transform(chunk, _encoding, cb) {
            htmlChunks.push(chunk);
            if (flightScripts) {
              htmlChunks.push(Buffer.from(flightScripts));
              flightScripts = '';
            }
            cb();
          },
          flush(cb) {
            if (flightScripts) {
              htmlChunks.push(Buffer.from(flightScripts));
              flightScripts = '';
            }
            resolve({
              html: Buffer.concat(htmlChunks).toString('utf-8'),
              rscPayload: Buffer.concat(rscPayloadChunks).toString('utf-8'),
            });
            cb();
          },
        });
        pipe(injector);
      },
      onError: reject,
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const itemCount = parseInt(process.argv[2], 10) || 200;

  console.log('Building RSC bundle...\n');
  await build();

  const {renderRSCNode, App: RSCApp, AppAsync: RSCAppAsync} =
    require('./build/rsc-bundle.js');
  const App = require('./src/App.js').default;
  const AppAsync = require('./src/AppAsync.js').default;

  const outputDir = path.resolve(__dirname, 'build');
  fs.mkdirSync(outputDir, {recursive: true});

  const variants = [
    {name: 'classical-sync', render: () => renderClassical(App, itemCount)},
    {
      name: 'flight-sync',
      render: () => renderFlight(renderRSCNode, RSCApp, itemCount),
    },
    {
      name: 'classical-async',
      render: () => renderClassical(AppAsync, itemCount),
    },
    {
      name: 'flight-async',
      render: () => renderFlight(renderRSCNode, RSCAppAsync, itemCount),
    },
  ];

  for (const {name, render} of variants) {
    const result = await render();
    const isFlight = typeof result === 'object' && result.rscPayload;
    const html = isFlight ? result.html : result;

    const outPath = path.join(outputDir, name + '.html');
    fs.writeFileSync(outPath, html);
    console.log('%s: %d bytes → %s', name, html.length, outPath);

    if (isFlight) {
      const rscPath = path.join(outputDir, name + '.rsc');
      fs.writeFileSync(rscPath, result.rscPayload);
      console.log('%s: %d bytes → %s', name + ' (rsc)', result.rscPayload.length, rscPath);
    }
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
