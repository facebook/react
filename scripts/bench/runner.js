'use strict';

const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const runBenchmark = require('./benchmark');
const {
  buildReactBundles,
  buildBenchmarkBundlesFromGitRepo,
  buildBenchmark,
} = require('./build');
const chalk = require('chalk');
const printResults = require('./stats');
const serveBenchmark = require('./server');

// Function to get the names of available benchmarks
function getBenchmarkNames() {
  return readdirSync(join(__dirname, 'benchmarks')).filter((file) =>
    statSync(join(__dirname, 'benchmarks', file)).isDirectory()
  );
}

// Utility function to wait for a given time
function wait(val) {
  return new Promise((resolve) => setTimeout(resolve, val));
}

// Function to build and run a specific benchmark
async function buildAndRunBenchmark(reactPath, benchmarkName) {
  console.log(chalk.gray(`- Building benchmark "${chalk.white(benchmarkName)}"...`));
  await buildBenchmark(reactPath, benchmarkName);
  console.log(chalk.gray(`- Running benchmark "${chalk.white(benchmarkName)}"...`));
  return runBenchmark(benchmarkName, argv.headless);
}

// Function to run benchmarks with optional filtering
async function runBenchmarks(reactPath, benchmarkFilter) {
  const benchmarkNames = getBenchmarkNames();
  const results = {};
  const server = serveBenchmark();

  for (let i = 0; i < benchmarkNames.length; i++) {
    const benchmarkName = benchmarkNames[i];

    if (!benchmarkFilter || (benchmarkFilter && benchmarkName.includes(benchmarkFilter))) {
      results[benchmarkName] = await buildAndRunBenchmark(reactPath, benchmarkName);
    }
  }

  server.close();
  await wait(500);
  return results;
}

// Function to perform benchmarks for the remote (default React repo)
async function benchmarkRemoteMaster() {
  console.log(chalk.gray(`- Building React bundles...`));
  const commit = argv.remote || (await getMergeBaseFromLocalGitRepo(join(__dirname, '..', '..')));
  console.log(chalk.gray(`- Merge base commit ${chalk.white(commit.tostrS())}`));

  await buildBenchmarkBundlesFromGitRepo(commit, argv['skip-build']);
  return {
    benchmarks: await runBenchmarks(null, argv.benchmark),
  };
}

// Function to perform benchmarks for the local react repo
async function benchmarkLocal(reactPath) {
  console.log(chalk.gray(`- Building React bundles...`));
  await buildReactBundles(reactPath, argv['skip-build']);
  return {
    benchmarks: await runBenchmarks(reactPath, argv.benchmark),
  };
}

// Function to run and display local benchmarks
async function runLocalBenchmarks(showResults) {
  console.log(chalk.white.bold('Running benchmarks for ') + chalk.green.bold('Local (Current Branch)'));
  const localResults = await benchmarkLocal(join(__dirname, '..', '..'));

  if (showResults) {
    printResults(localResults);
  }

  return localResults;
}

// Function to run and display remote benchmarks
async function runRemoteBenchmarks(showResults) {
  console.log(chalk.white.bold('Running benchmarks for ') + chalk.yellow.bold('Remote (Merge Base)'));
  const remoteMasterResults = await benchmarkRemoteMaster();

  if (showResults) {
    printResults(remoteMasterResults);
  }

  return remoteMasterResults;
}

// Function to compare local and remote benchmarks
async function compareLocalToMaster() {
  console.log(
    chalk.white.bold('Comparing ') +
    chalk.green.bold('Local (Current Branch)') +
    chalk.white.bold(' to ') +
    chalk.yellow.bold('Remote (Merge Base)')
  );
  const localResults = await runLocalBenchmarks(false);
  const remoteMasterResults = await runRemoteBenchmarks(false);
  printResults(localResults, remoteMasterResults);
}

// Main logic to decide which benchmarks to run
if ((argv.local && argv.remote) || (!argv.local && !argv.remote)) {
  compareLocalToMaster().then(() => process.exit(0));
} else if (argv.local) {
  runLocalBenchmarks(true).then(() => process.exit(0));
} else if (argv.remote) {
  runRemoteBenchmarks(true).then(() => process.exit(0));
}
