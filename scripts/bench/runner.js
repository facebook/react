'use strict';

const {
  readdirSync,
  statSync,
} = require('fs');
const { join } = require('path');
const runBenchmark = require('./benchmark');
const {
  buildBenchmarkBundlesFromGitRepo,
  buildBenchmarks,
} = require('./build');

function getBenchmarkNames() {
  return readdirSync(join(__dirname, 'benchmarks')).filter(
    file => statSync(join(__dirname, 'benchmarks', file)).isDirectory()
  );
}

async function runBenchmarks() {
  const benchmarkNames = getBenchmarkNames();
  const results = {};

  for (let i = 0; i < benchmarkNames.length; i++) {
    const benchmarkName = benchmarkNames[i];

    results[benchmarkName] = await runBenchmark(benchmarkName, true);
  }
  return results;
}

// get the performance benchmark results
// from remote master (default React repo)
async function benchmarkRemoteMaster() {
  return {
    // we build the FB bundles from the React repo
    bundles: await buildBenchmarkBundlesFromGitRepo(),
    // we use these FB bundles to run the benchmarks
    benchmarks: await runBenchmarks(),
  };
}

// get the performance benchmark results
// of the local react repo
async function benchmarkLocal(reactPath) {
  return {
    // we build the FB bundles from the React repo
    bundles: await buildBenchmarks(reactPath),
    // we use these FB bundles to run the benchmarks
    benchmarks: await runBenchmarks(),
  };
}

async function compareLocalToMaster() {
  console.log('-- Running benchmarks for remote master --');
  const masterResults = await benchmarkRemoteMaster();
  console.log('-- Running benchmarks for local --');
  const localResults = await benchmarkLocal(join(__dirname, '..', '..'));

  console.log('\n-- Local Results --\n');
  for (let benchmark in masterResults.benchmarks) {
    console.log(masterResults.benchmarks[benchmark].averages);
  }
  console.log('\n-- Remote Results --\n');
  for (let benchmark in localResults.benchmarks) {
    console.log(localResults.benchmarks[benchmark].averages);
  }
  // console.log(masterResults.bundles);
  // console.log(localResults.bundles);
}

compareLocalToMaster();
