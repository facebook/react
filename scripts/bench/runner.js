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
const argv = require('minimist')(process.argv.slice(2));

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

async function runLocalBenchmarks() {
  console.log('-- Running benchmarks for Local (Current Branch) --');
  const localResults = await benchmarkLocal(join(__dirname, '..', '..'));

  console.log('\n-- Local (Current Branch) Results --\n');
  for (let benchmark in localResults.benchmarks) {
    console.log(localResults.benchmarks[benchmark].averages);
  }
}

async function runRemoteBenchmarks() {
  console.log('-- Running benchmarks for Remote Master --');
  const remoteMasterResults = await benchmarkRemoteMaster();

  console.log('\n-- Remote Master Results --\n');
  for (let benchmark in remoteMasterResults.benchmarks) {
    console.log(remoteMasterResults.benchmarks[benchmark].averages);
  }
}

async function compareLocalToMaster() {
  console.log('-- Comparing Local (Current Branch) to Remote Master --');
  await runLocalBenchmarks();
  await runRemoteBenchmarks();
}

const runLocal = argv.local;
const runRemote = argv.remote;

if ((runLocal && runRemote) || (!runLocal && !runRemote)) {
  compareLocalToMaster().then(() => process.exit(0));
} else if (runLocal) {
  benchmarkLocal().then(() => process.exit(0));
} else if (runRemote) {
  runRemoteBenchmarks().then(() => process.exit(0));
}
