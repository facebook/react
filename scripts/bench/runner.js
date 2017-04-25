'use strict';

const {
  readdirSync,
  statSync,
} = require('fs');
const { join } = require('path');
const runBenchmark = require('./benchmark');
const {
  buildAllBundles,
  buildBenchmark,
  buildBenchmarkBundlesFromGitRepo,
} = require('./build');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const printResults = require('./stats');

function getBenchmarkNames() {
  return readdirSync(join(__dirname, 'benchmarks')).filter(
    file => statSync(join(__dirname, 'benchmarks', file)).isDirectory()
  );
}

async function runBenchmarks(reactPath) {
  const benchmarkNames = getBenchmarkNames();
  const results = {};

  for (let i = 0; i < benchmarkNames.length; i++) {
    const benchmarkName = benchmarkNames[i];

    console.log(chalk.gray(`- Running benchmark "${chalk.white(benchmarkName)}"`));
    await buildBenchmark(reactPath, benchmarkName);
    results[benchmarkName] = await runBenchmark(benchmarkName, true);
  }
  return results;
}

// get the performance benchmark results
// from remote master (default React repo)
async function benchmarkRemoteMaster() {
  return {
    // we build the bundles from the React repo
    bundles: await buildBenchmarkBundlesFromGitRepo(),
    // we use these bundles to run the benchmarks
    benchmarks: await runBenchmarks(),
  };
}

// get the performance benchmark results
// of the local react repo
async function benchmarkLocal(reactPath) {
  return {
    // we build the bundles from the React repo
    bundles: await buildAllBundles(reactPath),
    // we use these bundles to run the benchmarks
    benchmarks: await runBenchmarks(reactPath),
  };
}

async function runLocalBenchmarks(showResults) {
  console.log(
    chalk.white.bold('Running benchmarks for ')
    + chalk.green.bold('Local (Current Branch)')
  );
  const localResults = await benchmarkLocal(join(__dirname, '..', '..'));

  if (showResults) {
    printResults(localResults, null);
  }
  return localResults;
}

async function runRemoteBenchmarks(showResults) {
  console.log(
    chalk.white.bold('Running benchmarks for ')
    + chalk.yellow.bold('Remote Master')
  );  
  const remoteMasterResults = await benchmarkRemoteMaster();

  if (showResults) {
    printResults(null, remoteMasterResults);
  }
  return remoteMasterResults;
}

async function compareLocalToMaster() {
  console.log(
    chalk.white.bold('Comparing ')
    + chalk.green.bold('Local (Current Branch)')
    + chalk.white.bold(' to ')
    + chalk.yellow.bold('Remote Master')
  );
  const localResults = await runLocalBenchmarks(false);
  const remoteMasterResults = await runRemoteBenchmarks(false);
  printResults(localResults, remoteMasterResults);
}

const runLocal = argv.local;
const runRemote = argv.remote;

if ((runLocal && runRemote) || (!runLocal && !runRemote)) {
  compareLocalToMaster().then(() => process.exit(0));
} else if (runLocal) {
  runLocalBenchmarks(true).then(() => process.exit(0));
} else if (runRemote) {
  runRemoteBenchmarks(true).then(() => process.exit(0));
}
