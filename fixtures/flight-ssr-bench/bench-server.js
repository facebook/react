'use strict';

require('@babel/register')({
  presets: [['@babel/preset-react', {runtime: 'automatic'}]],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
  only: [/\/src\//],
});

const path = require('path');
const url = require('url');
const fs = require('fs');
const http = require('http');
const webpack = require('webpack');
const {PassThrough, Transform, Readable} = require('stream');

// ---------------------------------------------------------------------------
// Manifest setup (WebpackMock pattern)
// ---------------------------------------------------------------------------

const clientModules = {};
const clientChunkModules = {};
const clientManifest = {};
const ssrModuleMap = {};
let moduleIdx = 0;

function registerClientModule(modulePath) {
  const id = String(moduleIdx++);
  const chunkId = 'chunk-' + id;
  const absPath = path.resolve(__dirname, modulePath);
  const actualExports = require(absPath);
  clientModules[id] = actualExports;
  clientChunkModules[chunkId] = absPath;

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
global.__webpack_chunk_load__ = function () {
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
// Shared helpers
// ---------------------------------------------------------------------------

function escapeFlightChunk(data) {
  return JSON.stringify(data)
    .replace(/<!--/g, '<\\!--')
    .replace(/<\/(script)/gi, '</\\$1');
}

// ---------------------------------------------------------------------------
// Request handlers
// ---------------------------------------------------------------------------

function handleFizzNode(App, itemCount, res) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');

  const {pipe} = renderToPipeableStream(React.createElement(App, {itemCount}), {
    onShellReady() {
      pipe(res);
    },
    onError(e) {
      console.error('Fizz Node error:', e);
    },
  });
}

function handleFizzEdge(App, itemCount, res) {
  const React = require('react');
  const {renderToReadableStream} = require('react-dom/server');

  renderToReadableStream(React.createElement(App, {itemCount})).then(
    function (stream) {
      Readable.fromWeb(stream).pipe(res);
    },
    function (err) {
      console.error('Fizz Edge error:', err);
    }
  );
}

function handleFlightFizzNode(renderRSCNode, AppComponent, itemCount, res) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');
  const {createFromNodeStream} = require('react-server-dom-webpack/client');

  const {pipe: rscPipe} = renderRSCNode(
    clientManifest,
    AppComponent,
    itemCount
  );
  const trunk = new PassThrough();
  const forSsr = new PassThrough();
  const forInline = new PassThrough();
  trunk.pipe(forSsr);
  trunk.pipe(forInline);

  let flightScripts = '';
  forInline.on('data', function (chunk) {
    flightScripts +=
      '<script>(self.__FLIGHT_DATA||=[]).push(' +
      escapeFlightChunk(chunk.toString()) +
      ')</script>';
  });

  rscPipe(trunk);

  let cachedResult;
  function Root() {
    if (!cachedResult) {
      cachedResult = createFromNodeStream(forSsr, ssrManifest);
    }
    return React.use(cachedResult);
  }

  const {pipe} = renderToPipeableStream(React.createElement(Root), {
    onShellReady() {
      // Buffer HTML chunks within a tick before injecting Flight scripts,
      // to avoid splitting mid-tag. Same approach as rsc-html-stream.
      const trailer = '</body></html>';
      let buffered = [];
      let timeout = null;
      const injector = new Transform({
        transform(chunk, _encoding, cb) {
          buffered.push(chunk);
          if (!timeout) {
            timeout = setTimeout(() => {
              for (const buf of buffered) {
                let str = buf.toString();
                if (str.endsWith(trailer)) {
                  str = str.slice(0, -trailer.length);
                }
                this.push(str);
              }
              buffered.length = 0;
              timeout = null;
              if (flightScripts) {
                this.push(flightScripts);
                flightScripts = '';
              }
            }, 0);
          }
          cb();
        },
        flush(cb) {
          if (timeout) {
            clearTimeout(timeout);
            for (const buf of buffered) {
              let str = buf.toString();
              if (str.endsWith(trailer)) {
                str = str.slice(0, -trailer.length);
              }
              this.push(str);
            }
            buffered.length = 0;
          }
          if (flightScripts) {
            this.push(flightScripts);
            flightScripts = '';
          }
          this.push(trailer);
          cb();
        },
      });
      pipe(injector);
      injector.pipe(res);
    },
    onError(e) {
      console.error('Flight+Fizz Node error:', e);
    },
  });
}

function handleFlightFizzEdge(renderRSCEdge, AppComponent, itemCount, res) {
  const React = require('react');
  const {renderToReadableStream} = require('react-dom/server');
  const {
    createFromReadableStream,
  } = require('react-server-dom-webpack/client.edge');

  const htmlTrailer = '</body></html>';
  const enc = new TextEncoder();

  const webStream = renderRSCEdge(clientManifest, AppComponent, itemCount);
  const [forSsr, forInline] = webStream.tee();

  let resolveInline;
  const inlinePromise = new Promise(function (r) {
    resolveInline = r;
  });
  const htmlDecoder = new TextDecoder();
  let buffered = [];
  let timeout = null;

  function flushBuffered(controller) {
    for (const chunk of buffered) {
      let buf = htmlDecoder.decode(chunk, {stream: true});
      if (buf.endsWith(htmlTrailer)) {
        buf = buf.slice(0, -htmlTrailer.length);
      }
      controller.enqueue(enc.encode(buf));
    }
    const remaining = htmlDecoder.decode();
    if (remaining.length) {
      let buf = remaining;
      if (buf.endsWith(htmlTrailer)) {
        buf = buf.slice(0, -htmlTrailer.length);
      }
      controller.enqueue(enc.encode(buf));
    }
    buffered.length = 0;
    timeout = null;
  }

  function writeFlightChunk(data, controller) {
    controller.enqueue(
      enc.encode(
        '<script>(self.__FLIGHT_DATA||=[]).push(' +
          escapeFlightChunk(data) +
          ')</script>'
      )
    );
  }

  const injector = new TransformStream({
    start(controller) {
      (async function () {
        const reader = forInline.getReader();
        const decoder = new TextDecoder('utf-8', {fatal: true});
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          writeFlightChunk(decoder.decode(value, {stream: true}), controller);
        }
        const remaining = decoder.decode();
        if (remaining.length) {
          writeFlightChunk(remaining, controller);
        }
        resolveInline();
      })();
    },
    transform(chunk, controller) {
      buffered.push(chunk);
      if (!timeout) {
        timeout = setTimeout(function () {
          flushBuffered(controller);
        }, 0);
      }
    },
    async flush(controller) {
      await inlinePromise;
      if (timeout) {
        clearTimeout(timeout);
        flushBuffered(controller);
      }
      controller.enqueue(enc.encode(htmlTrailer));
    },
  });

  const cachedResult = createFromReadableStream(forSsr, {
    serverConsumerManifest: ssrManifest,
  });
  function Root() {
    return React.use(cachedResult);
  }

  renderToReadableStream(React.createElement(Root)).then(
    function (htmlStream) {
      const outputStream = htmlStream.pipeThrough(injector);
      Readable.fromWeb(outputStream).pipe(res);
    },
    function (err) {
      console.error('Flight+Fizz Edge error:', err);
    }
  );
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const ITEM_COUNT = 200;
const PORT = 3001;

async function main() {
  console.log('Building RSC bundle...\n');
  await build();

  const {
    renderRSCNode,
    renderRSCEdge,
    App: RSCApp,
    AppAsync: RSCAppAsync,
  } = require('./build/rsc-bundle.js');
  const App = require('./src/App.js').default;
  const AppAsync = require('./src/AppAsync.js').default;

  const routes = {
    '/fizz-node-sync': res => handleFizzNode(App, ITEM_COUNT, res),
    '/fizz-node-async': res => handleFizzNode(AppAsync, ITEM_COUNT, res),
    '/fizz-edge-sync': res => handleFizzEdge(App, ITEM_COUNT, res),
    '/fizz-edge-async': res => handleFizzEdge(AppAsync, ITEM_COUNT, res),
    '/flight-node-sync': res =>
      handleFlightFizzNode(renderRSCNode, RSCApp, ITEM_COUNT, res),
    '/flight-node-async': res =>
      handleFlightFizzNode(renderRSCNode, RSCAppAsync, ITEM_COUNT, res),
    '/flight-edge-sync': res =>
      handleFlightFizzEdge(renderRSCEdge, RSCApp, ITEM_COUNT, res),
    '/flight-edge-async': res =>
      handleFlightFizzEdge(renderRSCEdge, RSCAppAsync, ITEM_COUNT, res),
  };

  const server = http.createServer(function (req, res) {
    const handler = routes[req.url];
    if (!handler) {
      // Index page listing all endpoints
      if (req.url === '/' || req.url === '') {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(
          '<html><body><h1>Flight SSR Bench</h1><ul>' +
            Object.keys(routes)
              .map(function (r) {
                return '<li><a href="' + r + '">' + r + '</a></li>';
              })
              .join('') +
            '</ul></body></html>'
        );
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    handler(res);
  });

  await new Promise(function (resolve) {
    server.listen(PORT, resolve);
  });

  console.log('\nServer listening on http://localhost:%d', PORT);
  console.log('Endpoints:');
  for (const route of Object.keys(routes)) {
    console.log('  http://localhost:%d%s', PORT, route);
  }

  if (!process.argv.includes('--bench')) {
    return;
  }

  // Run autocannon against each endpoint.
  // Use a fixed request count (amount) instead of duration so that all
  // in-flight requests complete before autocannon closes connections.
  const autocannon = require('autocannon');
  const concurrencyLevels = [1, 10];
  const WARMUP_AMOUNT = 200;
  const BENCH_AMOUNT = 1000;

  function runAutocannon(url, connections, amount) {
    return new Promise(function (resolve, reject) {
      const instance = autocannon({url, connections, amount});
      autocannon.track(instance, {
        renderProgressBar: false,
        renderResultsTable: false,
      });
      instance.on('done', resolve);
      instance.on('error', reject);
    });
  }

  function printGrid(colHeaders, rows, getValue, unit) {
    const labelWidth = Math.max(
      ...rows.map(function (r) {
        return r[0].length;
      })
    );
    const suffix = unit ? ' ' + unit : '';
    const fmtVal = function (v) {
      return (v.toFixed(1) + suffix).padStart(10 + suffix.length);
    };
    const fmtPct = function (v) {
      return ((v >= 0 ? '+' : '') + v.toFixed(1) + '%').padStart(8);
    };
    const colWidth = 10 + suffix.length;
    const header =
      ''.padEnd(labelWidth) +
      '  ' +
      colHeaders
        .map(function (h) {
          return h.padStart(colWidth);
        })
        .join('  ') +
      '     Delta';
    console.log('  ' + header);
    console.log('  ' + '-'.repeat(header.length));
    for (const [label, a, b] of rows) {
      const va = getValue(a);
      const vb = getValue(b);
      const pct = ((vb - va) / va) * 100;
      console.log(
        '  ' +
          label.padEnd(labelWidth) +
          '  ' +
          fmtVal(va) +
          '  ' +
          fmtVal(vb) +
          '  ' +
          fmtPct(pct)
      );
    }
  }

  for (const c of concurrencyLevels) {
    console.log(
      '\n--- HTTP Benchmark (%d warmup, c=%d, %d requests) ---\n',
      WARMUP_AMOUNT,
      c,
      BENCH_AMOUNT
    );

    const results = {};
    const labels = Object.keys(routes).map(function (r) {
      return r.slice(1);
    });
    const labelWidth = Math.max(
      ...labels.map(function (l) {
        return l.length;
      })
    );

    const header =
      ''.padEnd(labelWidth) +
      '  ' +
      'req/s'.padStart(14) +
      '  ' +
      'p50'.padStart(8) +
      '  ' +
      'p99'.padStart(8);
    console.log('  ' + header);
    console.log('  ' + '-'.repeat(header.length));

    for (const route of Object.keys(routes)) {
      const label = route.slice(1);
      const url = 'http://localhost:' + PORT + route;

      // Warmup
      await runAutocannon(url, c, WARMUP_AMOUNT);

      const data = await runAutocannon(url, c, BENCH_AMOUNT);
      const reqPerSec = data.requests.total / data.duration;
      const latencyMedian = data.latency.p50;
      const latencyP99 = data.latency.p99;
      const errors = data.errors + data.timeouts;

      results[label] = {reqPerSec, latencyMedian, latencyP99};

      let line =
        '  ' +
        label.padEnd(labelWidth) +
        '  ' +
        String(reqPerSec.toFixed(1)).padStart(8) +
        ' req/s' +
        '  ' +
        String(latencyMedian).padStart(5) +
        ' ms' +
        '  ' +
        String(latencyP99).padStart(5) +
        ' ms';
      if (errors > 0) {
        line += '  (' + errors + ' errors)';
      }
      console.log(line);
    }

    const rps = function (r) {
      return r.reqPerSec;
    };

    console.log('\n--- Flight overhead (c=%d) ---\n', c);
    printGrid(
      ['Fizz', 'Flight+Fizz'],
      [
        ['Node sync', results['fizz-node-sync'], results['flight-node-sync']],
        [
          'Node async',
          results['fizz-node-async'],
          results['flight-node-async'],
        ],
        ['Edge sync', results['fizz-edge-sync'], results['flight-edge-sync']],
        [
          'Edge async',
          results['fizz-edge-async'],
          results['flight-edge-async'],
        ],
      ],
      rps,
      'req/s'
    );

    console.log('\n--- Edge vs Node (c=%d) ---\n', c);
    printGrid(
      ['Node', 'Edge'],
      [
        ['Fizz sync', results['fizz-node-sync'], results['fizz-edge-sync']],
        ['Fizz async', results['fizz-node-async'], results['fizz-edge-async']],
        [
          'Flight+Fizz sync',
          results['flight-node-sync'],
          results['flight-edge-sync'],
        ],
        [
          'Flight+Fizz async',
          results['flight-node-async'],
          results['flight-edge-async'],
        ],
      ],
      rps,
      'req/s'
    );
  }

  server.close();
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
