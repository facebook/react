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
const inspector = require('node:inspector');

const PROFILE_MODE = process.argv.includes('--profile');
const ISOLATE_MODE = process.argv.includes('--isolate');

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
  // Pre-register the chunk so __webpack_chunk_load__ can find it.
  clientChunkModules[chunkId] = absPath;

  const href = url.pathToFileURL(absPath).href;
  // Provide chunk IDs like a real webpack build would. The chunks array
  // format is [chunkId, chunkFilename, ...] in pairs.
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
  // Simulate SSR chunk loading: resolve asynchronously like a real
  // webpack runtime loading a separate chunk file from disk.
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

// Fizz (Node) — renders App directly via Node streams.
function renderFizzNode(AppComponent, itemCount) {
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

// Flight + Fizz (Node) — RSC render → Node stream → Fizz via Node streams.
function renderFlightFizzNode(rscBundle, AppComponent, itemCount) {
  const React = require('react');
  const {renderToPipeableStream} = require('react-dom/server');
  const {createFromNodeStream} = require('react-server-dom-webpack/client');

  // Phase 1: RSC → Flight stream
  const {pipe: rscPipe} = rscBundle(clientManifest, AppComponent, itemCount);
  const flightStream = new PassThrough();
  rscPipe(flightStream);

  // Phase 2: Flight stream → React tree → HTML
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

// Fizz (Edge) — renders App directly via web streams.
async function renderFizzEdge(AppComponent, itemCount) {
  const React = require('react');
  const {renderToReadableStream} = require('react-dom/server');

  const stream = await renderToReadableStream(
    React.createElement(AppComponent, {itemCount})
  );
  const reader = stream.getReader();
  const chunks = [];
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Flight + Fizz (Edge) — RSC render → ReadableStream → Fizz via web streams.
function renderFlightFizzEdge(rscBundle, AppComponent, itemCount) {
  const React = require('react');
  const {renderToReadableStream} = require('react-dom/server');
  const {
    createFromReadableStream,
  } = require('react-server-dom-webpack/client.edge');
  const {Readable} = require('stream');

  // Phase 1: RSC → Node stream → Web ReadableStream
  const {pipe: rscPipe} = rscBundle(clientManifest, AppComponent, itemCount);
  const nodeStream = new PassThrough();
  rscPipe(nodeStream);
  const webStream = Readable.toWeb(nodeStream);

  // Phase 2: ReadableStream → React tree → HTML
  const cachedResult = createFromReadableStream(webStream, {
    serverConsumerManifest: ssrManifest,
  });
  function Root() {
    return React.use(cachedResult);
  }

  return renderToReadableStream(React.createElement(Root)).then(
    function (stream) {
      const reader = stream.getReader();
      const chunks = [];
      function read() {
        return reader.read().then(function ({done, value}) {
          if (done) {
            return Buffer.concat(chunks).toString('utf-8');
          }
          chunks.push(Buffer.from(value));
          return read();
        });
      }
      return read();
    }
  );
}

// ---------------------------------------------------------------------------
// Benchmarking
// ---------------------------------------------------------------------------

const canGC = typeof globalThis.gc === 'function';

async function runBenchmark(name, fn, iterations, warmup) {
  // Warmup
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // Timed iterations
  const times = [];
  for (let i = 0; i < iterations; i++) {
    if (canGC) globalThis.gc();
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  // Trim top/bottom 5% to remove outliers
  const sorted = [...times].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * 0.05);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  const mean = trimmed.reduce((s, t) => s + t, 0) / trimmed.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const stddev = Math.sqrt(
    trimmed.reduce((s, t) => s + (t - mean) ** 2, 0) / trimmed.length
  );
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return {name, mean, median, stddev, p95, min, max, iterations};
}

function printResult(result) {
  console.log('  %s:', result.name);
  console.log('    Mean:   %s ms', result.mean.toFixed(2));
  console.log('    Median: %s ms', result.median.toFixed(2));
  console.log('    Stddev: %s ms', result.stddev.toFixed(2));
  console.log('    P95:    %s ms', result.p95.toFixed(2));
  console.log('    Min:    %s ms', result.min.toFixed(2));
  console.log('    Max:    %s ms', result.max.toFixed(2));
}

function printOverhead(baseline, comparison) {
  const pctMean = ((comparison.mean - baseline.mean) / baseline.mean) * 100;
  const pctMedian =
    ((comparison.median - baseline.median) / baseline.median) * 100;
  const pctP95 = ((comparison.p95 - baseline.p95) / baseline.p95) * 100;
  const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  console.log(
    '  %s vs %s: %s (median), %s (p95), %s (trimmed mean)',
    comparison.name,
    baseline.name,
    fmt(pctMedian),
    fmt(pctP95),
    fmt(pctMean)
  );
}

// ---------------------------------------------------------------------------
// CPU Profiling
// ---------------------------------------------------------------------------

function startProfiler() {
  const session = new inspector.Session();
  session.connect();
  return new Promise(function (resolve, reject) {
    session.post('Profiler.enable', function (err) {
      if (err) {
        reject(err);
        return;
      }
      session.post('Profiler.start', function (err2) {
        if (err2) {
          reject(err2);
          return;
        }
        resolve(session);
      });
    });
  });
}

function stopProfiler(session, outputPath) {
  return new Promise(function (resolve, reject) {
    session.post('Profiler.stop', function (err, {profile}) {
      if (err) {
        reject(err);
        return;
      }
      fs.mkdirSync(path.dirname(outputPath), {recursive: true});
      fs.writeFileSync(outputPath, JSON.stringify(profile));
      session.post('Profiler.disable');
      session.disconnect();
      resolve(profile);
    });
  });
}

function printTopFunctions(profile, topN) {
  // Aggregate self-time per function from the profile nodes.
  const selfTimes = new Map();
  for (const node of profile.nodes) {
    const name = node.callFrame.functionName || '(anonymous)';
    const loc = node.callFrame.url
      ? node.callFrame.url.replace(/.*\//, '') + ':' + node.callFrame.lineNumber
      : '(native)';
    const key = name + ' @ ' + loc;
    const hitCount = node.hitCount || 0;
    selfTimes.set(key, (selfTimes.get(key) || 0) + hitCount);
  }

  const sorted = [...selfTimes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  const totalSamples = profile.nodes.reduce((s, n) => s + (n.hitCount || 0), 0);

  console.log('    Top %d functions by self-time:', topN);
  for (const [key, hits] of sorted) {
    const pct = ((hits / totalSamples) * 100).toFixed(1);
    console.log('      %s%% - %s', pct, key);
  }
}

async function profileRun(name, fn, warmup, iterations, outputPath) {
  // Warmup (unprofilied)
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // Profiled run
  const session = await startProfiler();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const profile = await stopProfiler(session, outputPath);

  console.log('  %s → %s', name, outputPath);
  printTopFunctions(profile, 10);
}

// ---------------------------------------------------------------------------
// Isolated (per-process) runner
// ---------------------------------------------------------------------------

const {execFileSync} = require('child_process');

function runIsolated(mode, app, items) {
  const result = execFileSync(
    process.execPath,
    [
      '--expose-gc',
      path.resolve(__dirname, 'bench-worker.js'),
      '--mode',
      mode,
      '--app',
      app,
      '--items',
      String(items),
    ],
    {
      env: {...process.env, NODE_ENV: 'production'},
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    }
  );
  return parseFloat(result.trim());
}

async function runIsolatedBenchmark(
  name,
  mode,
  app,
  items,
  iterations,
  warmup
) {
  for (let i = 0; i < warmup; i++) {
    runIsolated(mode, app, items);
  }

  const times = [];
  for (let i = 0; i < iterations; i++) {
    times.push(runIsolated(mode, app, items));
  }

  const sorted = [...times].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * 0.05);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  const mean = trimmed.reduce((s, t) => s + t, 0) / trimmed.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const stddev = Math.sqrt(
    trimmed.reduce((s, t) => s + (t - mean) ** 2, 0) / trimmed.length
  );
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return {name, mean, median, stddev, p95, min, max, iterations};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Building RSC bundle...\n');
  await build();

  const rscBundle = require('./build/rsc-bundle.js').default;
  const rscApps = require('./build/rsc-bundle.js');
  const App = require('./src/App.js').default;
  const AppAsync = require('./src/AppAsync.js').default;

  const ITEM_COUNT = 200;

  if (ISOLATE_MODE) {
    const WARMUP = 10;
    const ITERATIONS = 50;

    console.log(
      '\n--- Isolated Benchmark (%d warmup, %d iterations, %d items) ---\n',
      WARMUP,
      ITERATIONS,
      ITEM_COUNT
    );

    const fizzNodeSync = await runIsolatedBenchmark(
      'Fizz (Node, sync)',
      'classical',
      'sync',
      ITEM_COUNT,
      ITERATIONS,
      WARMUP
    );
    printResult(fizzNodeSync);

    const flightFizzNodeSync = await runIsolatedBenchmark(
      'Flight + Fizz (Node, sync)',
      'flight',
      'sync',
      ITEM_COUNT,
      ITERATIONS,
      WARMUP
    );
    printResult(flightFizzNodeSync);

    const fizzNodeAsync = await runIsolatedBenchmark(
      'Fizz (Node, async)',
      'classical',
      'async',
      ITEM_COUNT,
      ITERATIONS,
      WARMUP
    );
    printResult(fizzNodeAsync);

    const flightFizzNodeAsync = await runIsolatedBenchmark(
      'Flight + Fizz (Node, async)',
      'flight',
      'async',
      ITEM_COUNT,
      ITERATIONS,
      WARMUP
    );
    printResult(flightFizzNodeAsync);

    console.log('\n--- Overhead ---\n');
    printOverhead(fizzNodeSync, flightFizzNodeSync);
    printOverhead(fizzNodeAsync, flightFizzNodeAsync);
    return;
  }

  const WARMUP = 50;
  const ITERATIONS = 200;
  const PROFILE_WARMUP = 20;
  const PROFILE_ITERATIONS = 100;

  // --- Verify renders ---
  console.log('\n--- Verifying renders ---\n');

  const fizzNodeHtml = await renderFizzNode(App, ITEM_COUNT);
  console.log('Fizz (Node, sync):          %d bytes', fizzNodeHtml.length);

  const flightFizzNodeHtml = await renderFlightFizzNode(
    rscBundle,
    rscApps.App,
    ITEM_COUNT
  );
  console.log(
    'Flight + Fizz (Node, sync): %d bytes',
    flightFizzNodeHtml.length
  );

  const fizzNodeAsyncHtml = await renderFizzNode(AppAsync, ITEM_COUNT);
  console.log('Fizz (Node, async):         %d bytes', fizzNodeAsyncHtml.length);

  const flightFizzNodeAsyncHtml = await renderFlightFizzNode(
    rscBundle,
    rscApps.AppAsync,
    ITEM_COUNT
  );
  console.log(
    'Flight + Fizz (Node, async):%d bytes',
    flightFizzNodeAsyncHtml.length
  );

  const fizzEdgeHtml = await renderFizzEdge(App, ITEM_COUNT);
  console.log('Fizz (Edge, sync):          %d bytes', fizzEdgeHtml.length);

  const fizzEdgeAsyncHtml = await renderFizzEdge(AppAsync, ITEM_COUNT);
  console.log('Fizz (Edge, async):         %d bytes', fizzEdgeAsyncHtml.length);

  const flightFizzEdgeHtml = await renderFlightFizzEdge(
    rscBundle,
    rscApps.App,
    ITEM_COUNT
  );
  console.log(
    'Flight + Fizz (Edge, sync): %d bytes',
    flightFizzEdgeHtml.length
  );

  const flightFizzEdgeAsyncHtml = await renderFlightFizzEdge(
    rscBundle,
    rscApps.AppAsync,
    ITEM_COUNT
  );
  console.log(
    'Flight + Fizz (Edge, async):%d bytes',
    flightFizzEdgeAsyncHtml.length
  );

  // --- Benchmark ---
  console.log(
    '\n--- Benchmark (%d warmup, %d iterations, %d items) ---\n',
    WARMUP,
    ITERATIONS,
    ITEM_COUNT
  );

  const fizzNodeSync = await runBenchmark(
    'Fizz (Node, sync)',
    () => renderFizzNode(App, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(fizzNodeSync);

  const flightFizzNodeSync = await runBenchmark(
    'Flight + Fizz (Node, sync)',
    () => renderFlightFizzNode(rscBundle, rscApps.App, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(flightFizzNodeSync);

  const fizzNodeAsync = await runBenchmark(
    'Fizz (Node, async)',
    () => renderFizzNode(AppAsync, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(fizzNodeAsync);

  const flightFizzNodeAsync = await runBenchmark(
    'Flight + Fizz (Node, async)',
    () => renderFlightFizzNode(rscBundle, rscApps.AppAsync, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(flightFizzNodeAsync);

  const fizzEdgeSync = await runBenchmark(
    'Fizz (Edge, sync)',
    () => renderFizzEdge(App, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(fizzEdgeSync);

  const flightFizzEdgeSync = await runBenchmark(
    'Flight + Fizz (Edge, sync)',
    () => renderFlightFizzEdge(rscBundle, rscApps.App, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(flightFizzEdgeSync);

  const fizzEdgeAsync = await runBenchmark(
    'Fizz (Edge, async)',
    () => renderFizzEdge(AppAsync, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(fizzEdgeAsync);

  const flightFizzEdgeAsync = await runBenchmark(
    'Flight + Fizz (Edge, async)',
    () => renderFlightFizzEdge(rscBundle, rscApps.AppAsync, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(flightFizzEdgeAsync);

  console.log('\n--- Overhead (Flight + Fizz vs Fizz) ---\n');
  printOverhead(fizzNodeSync, flightFizzNodeSync);
  printOverhead(fizzNodeAsync, flightFizzNodeAsync);
  printOverhead(fizzEdgeSync, flightFizzEdgeSync);
  printOverhead(fizzEdgeAsync, flightFizzEdgeAsync);

  console.log('\n--- Overhead (Edge vs Node) ---\n');
  printOverhead(fizzNodeSync, fizzEdgeSync);
  printOverhead(fizzNodeAsync, fizzEdgeAsync);
  printOverhead(flightFizzNodeSync, flightFizzEdgeSync);
  printOverhead(flightFizzNodeAsync, flightFizzEdgeAsync);

  // --- CPU Profiling ---
  if (PROFILE_MODE) {
    console.log(
      '\n--- CPU Profiling (%d warmup, %d iterations) ---\n',
      PROFILE_WARMUP,
      PROFILE_ITERATIONS
    );

    const profileDir = path.resolve(__dirname, 'build/profiles');

    await profileRun(
      'Fizz (Node, sync)',
      () => renderFizzNode(App, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'fizz-node-sync.cpuprofile')
    );

    await profileRun(
      'Flight + Fizz (Node, sync)',
      () => renderFlightFizzNode(rscBundle, rscApps.App, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'flight-fizz-node-sync.cpuprofile')
    );

    await profileRun(
      'Fizz (Node, async)',
      () => renderFizzNode(AppAsync, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'fizz-node-async.cpuprofile')
    );

    await profileRun(
      'Flight + Fizz (Node, async)',
      () => renderFlightFizzNode(rscBundle, rscApps.AppAsync, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'flight-fizz-node-async.cpuprofile')
    );

    console.log(
      '\nProfiles saved to build/profiles/. Open in Chrome DevTools or speedscope.app.'
    );
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
