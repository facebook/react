'use strict';

const {readdirSync, statSync} = require('fs');
const {join} = require('path');
const uniqueRandomArray = require('unique-random-array');
const {
  runBenchmark,
  calculateAverages
 } = require('./benchmark');
const {
  buildReactBundles,
  buildBenchmark,
  buildBenchmarkBundlesFromGitRepo,
  getMergeBaseFromLocalGitRepo,
} = require('./build');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const printResults = require('./stats');
const serveBenchmark = require('./server');

const BENCHMARK_TRIAL_RUN_LIMIT = 10;

function getBenchmarkNames() {
  return readdirSync(join(__dirname, 'benchmarks')).filter(file =>
    statSync(join(__dirname, 'benchmarks', file)).isDirectory()
  );
}

function wait(val) {
  return new Promise(resolve => setTimeout(resolve, val));
}

const runRemote = argv.remote;
const runLocal = argv.local;
const benchmarkFilter = argv.benchmark;
const headless = argv.headless;
const skipBuild = argv['skip-build'];

function terminationReached(benchmarkProgressObj){
  let populatedNames = Object.keys(benchmarkProgressObj);
	let terminated = populatedNames.reduce((base, benchmarkName) => {
    base = base && (benchmarkProgressObj[benchmarkName] == BENCHMARK_TRIAL_RUN_LIMIT);
    return base;
	}, true);
	return terminated;
}

function initializeBenchmarkProgressObj(benchmarkNames){
	let progressObj = {};
	benchmarkNames.forEach((key) => {
		progressObj[key] = 0;
  });
  return progressObj;
}

async function runBenchmarks(reactPath) {
  const benchmarkNames = getBenchmarkNames();
  const results = {};
  let filteredBenchmarkNames = benchmarkNames;
  if(benchmarkFilter){
    filteredBenchmarkNames = benchmarkNames.filter((name) => name.indexOf(benchmarkFilter) !== -1 );
  }
  let benchmarkProgressObj = initializeBenchmarkProgressObj(filteredBenchmarkNames);
  let getRandomBenchmarkName = uniqueRandomArray(filteredBenchmarkNames);
  const server = serveBenchmark();
  await wait(1000);

  while (!terminationReached(benchmarkProgressObj)) {
    const benchmarkName = getRandomBenchmarkName();
    if (!results[benchmarkName]) {
      results[benchmarkName] = {
        runs: [],
        averages: []
      };
    }
    if (benchmarkProgressObj[benchmarkName] < BENCHMARK_TRIAL_RUN_LIMIT) {
      console.log(
        chalk.gray(`- Building benchmark "${chalk.white(benchmarkName)}"...`)
      );
      await buildBenchmark(reactPath, benchmarkName);
      console.log(
        chalk.gray(`- Running benchmark "${chalk.white(benchmarkName)}"...`)
      );
      let benchmarkResult = await runBenchmark(benchmarkName, headless);
      results[benchmarkName]['runs'].push(benchmarkResult);
      benchmarkProgressObj[benchmarkName] += 1;
    }
  }
  for (let i=0; i < filteredBenchmarkNames.length; i++) {
    const benchmarkName = filteredBenchmarkNames[i];
    const runs = results[benchmarkName]['runs'];
    results[benchmarkName]['averages'] = calculateAverages(runs);
  }

  server.close();
  // http-server.close() is async but they don't provide a callback..
  await wait(500);
  return results;
}

// get the performance benchmark results
// from remote master (default React repo)
async function benchmarkRemoteMaster() {
  console.log(chalk.gray(`- Building React bundles...`));
  let commit = argv.remote;

  if (!commit || typeof commit !== 'string') {
    commit = await getMergeBaseFromLocalGitRepo(join(__dirname, '..', '..'));
    console.log(
      chalk.gray(`- Merge base commit ${chalk.white(commit.tostrS())}`)
    );
  }
  await buildBenchmarkBundlesFromGitRepo(commit, skipBuild);
  return {
    benchmarks: await runBenchmarks(),
  };
}

// get the performance benchmark results
// of the local react repo
async function benchmarkLocal(reactPath) {
  console.log(chalk.gray(`- Building React bundles...`));
  await buildReactBundles(reactPath, skipBuild);
  return {
    benchmarks: await runBenchmarks(reactPath),
  };
}

async function runLocalBenchmarks(showResults) {
  console.log(
    chalk.white.bold('Running benchmarks for ') +
      chalk.green.bold('Local (Current Branch)')
  );
  const localResults = await benchmarkLocal(join(__dirname, '..', '..'));

  if (showResults) {
    printResults(localResults, null);
  }
  return localResults;
}

async function runRemoteBenchmarks(showResults) {
  console.log(
    chalk.white.bold('Running benchmarks for ') +
      chalk.yellow.bold('Remote (Merge Base)')
  );
  const remoteMasterResults = await benchmarkRemoteMaster();

  if (showResults) {
    printResults(null, remoteMasterResults);
  }
  return remoteMasterResults;
}

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

if ((runLocal && runRemote) || (!runLocal && !runRemote)) {
  compareLocalToMaster().then(() => process.exit(0));
} else if (runLocal) {
  runLocalBenchmarks(true).then(() => process.exit(0));
} else if (runRemote) {
  runRemoteBenchmarks(true).then(() => process.exit(0));
}
