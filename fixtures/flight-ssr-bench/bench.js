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

// ---------------------------------------------------------------------------
// Manifest setup (WebpackMock pattern)
// ---------------------------------------------------------------------------

const clientModules = {};
const clientManifest = {};
const ssrModuleMap = {};
let moduleIdx = 0;

function registerClientModule(modulePath) {
  const id = String(moduleIdx++);
  const absPath = path.resolve(__dirname, modulePath);
  const actualExports = require(absPath);
  clientModules[id] = actualExports;

  const href = url.pathToFileURL(absPath).href;
  clientManifest[href] = {id, chunks: [], name: '*'};
  ssrModuleMap[id] = {'*': {id, chunks: [], name: '*'}};
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
global.__webpack_chunk_load__ = function () {
  return Promise.resolve();
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

// Classical SSR — renders App directly with react-dom/server.
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

// Flight SSR — RSC render → Flight stream → SSR render.
function renderFlight(rscBundle, AppComponent, itemCount) {
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
  const pctMean =
    ((comparison.mean - baseline.mean) / baseline.mean) * 100;
  const pctMedian =
    ((comparison.median - baseline.median) / baseline.median) * 100;
  const sign = pctMedian >= 0 ? '+' : '';
  console.log(
    '  %s vs %s: %s%s%% (median), %s%s%% (trimmed mean)',
    comparison.name,
    baseline.name,
    sign,
    pctMedian.toFixed(1),
    pctMean >= 0 ? '+' : '',
    pctMean.toFixed(1)
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
    const name =
      node.callFrame.functionName || '(anonymous)';
    const loc = node.callFrame.url
      ? node.callFrame.url.replace(/.*\//, '') +
        ':' +
        node.callFrame.lineNumber
      : '(native)';
    const key = name + ' @ ' + loc;
    const hitCount = node.hitCount || 0;
    selfTimes.set(key, (selfTimes.get(key) || 0) + hitCount);
  }

  const sorted = [...selfTimes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  const totalSamples = profile.nodes.reduce(
    (s, n) => s + (n.hitCount || 0),
    0
  );

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
  const WARMUP = 50;
  const ITERATIONS = 200;
  const PROFILE_WARMUP = 20;
  const PROFILE_ITERATIONS = 100;

  // --- Verify renders ---
  console.log('\n--- Verifying renders ---\n');

  const classicalHtml = await renderClassical(App, ITEM_COUNT);
  console.log('Classical SSR (sync):  %d bytes', classicalHtml.length);

  const flightHtml = await renderFlight(rscBundle, rscApps.App, ITEM_COUNT);
  console.log('Flight SSR (sync):     %d bytes', flightHtml.length);

  const classicalAsyncHtml = await renderClassical(AppAsync, ITEM_COUNT);
  console.log('Classical SSR (async): %d bytes', classicalAsyncHtml.length);

  const flightAsyncHtml = await renderFlight(
    rscBundle,
    rscApps.AppAsync,
    ITEM_COUNT
  );
  console.log('Flight SSR (async):    %d bytes', flightAsyncHtml.length);

  // --- Benchmark ---
  console.log(
    '\n--- Benchmark (%d warmup, %d iterations, %d items) ---\n',
    WARMUP,
    ITERATIONS,
    ITEM_COUNT
  );

  const classicalSync = await runBenchmark(
    'Classical SSR (sync)',
    () => renderClassical(App, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(classicalSync);

  const flightSync = await runBenchmark(
    'Flight SSR (sync)',
    () => renderFlight(rscBundle, rscApps.App, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(flightSync);

  const classicalAsync = await runBenchmark(
    'Classical SSR (async)',
    () => renderClassical(AppAsync, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(classicalAsync);

  const flightAsync = await runBenchmark(
    'Flight SSR (async)',
    () => renderFlight(rscBundle, rscApps.AppAsync, ITEM_COUNT),
    ITERATIONS,
    WARMUP
  );
  printResult(flightAsync);

  console.log('\n--- Overhead ---\n');
  printOverhead(classicalSync, flightSync);
  printOverhead(classicalAsync, flightAsync);

  // --- CPU Profiling ---
  if (PROFILE_MODE) {
    console.log(
      '\n--- CPU Profiling (%d warmup, %d iterations) ---\n',
      PROFILE_WARMUP,
      PROFILE_ITERATIONS
    );

    const profileDir = path.resolve(__dirname, 'build/profiles');

    await profileRun(
      'Classical SSR (sync)',
      () => renderClassical(App, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'sync-classical.cpuprofile')
    );

    await profileRun(
      'Flight SSR (sync)',
      () => renderFlight(rscBundle, rscApps.App, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'sync-flight.cpuprofile')
    );

    await profileRun(
      'Classical SSR (async)',
      () => renderClassical(AppAsync, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'async-classical.cpuprofile')
    );

    await profileRun(
      'Flight SSR (async)',
      () => renderFlight(rscBundle, rscApps.AppAsync, ITEM_COUNT),
      PROFILE_WARMUP,
      PROFILE_ITERATIONS,
      path.join(profileDir, 'async-flight.cpuprofile')
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
