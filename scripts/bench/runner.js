'use strict';

const {readdirSync, statSync, existsSync, mkdirSync} = require('fs');
const {join} = require('path');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const _ = require('lodash');
const runBenchmarkQueue = require('./benchmark');
const {
  buildReactBundles,
  buildReactBundlesFromGitRepo,
  getMergeBaseFromLocalGitRepo,
  buildBenchmark,
} = require('./build');
const serveBenchmark = require('./server');
const printResults = require('./stats');
const {wait, cleanDir, asyncCopyTo} = require('./utils');

// Runner args
const runRemote = !!argv.remote || !argv.local;
const runLocal = !!argv.local || !argv.remote;
const benchmarkFilter = argv.benchmark;
const remoteCommitId = argv.remote && typeof argv.remote === 'string' ? argv.remote : null;
const skipBuild = argv['skip-build'];
const headless = argv.headless;
const runOrder = argv['run-order'] === 'random' ? 'random' : 'interleaved';
const timesToRun = argv['times-to-run'] ? parseInt(argv['times-to-run'], 10) : 10;

// Setup used paths
const localReactPath = join(__dirname, '..', '..');
const localBenchmarksPath = join(
  localReactPath,
  'scripts',
  'bench',
  'benchmarks'
);
const remoteReactPath = join(__dirname, 'remote-repo');
const remoteBenchmarksPath = join(
  remoteReactPath,
  'scripts',
  'bench',
  'benchmarks'
);
const serverRootPath = join(__dirname, 'public');

/**
 * Build local and remote react bundles
 */
async function prepareReactBuilds() {
  if (runLocal) {
    console.log(chalk.gray(`- Building local React bundles...`));
    await buildReactBundles(localReactPath, skipBuild);
  }

  if (runRemote) {
    console.log(chalk.gray(`- Building remote React bundles...`));

    let commitId = remoteCommitId;
    if (!commitId) {
      commitId = await getMergeBaseFromLocalGitRepo(localReactPath);
      console.log(
        chalk.gray(`- Merge base commit ${chalk.white(commitId.tostrS())}`)
      );
    }
    await buildReactBundlesFromGitRepo(remoteReactPath, commitId, skipBuild);
  }
}

/**
 * Build an object defining the benchmarks to be run.
 */
function getBenchmarkPlan() {
  const benchmarkPlan = {};

  if (runLocal) {
    benchmarkPlan.local = getBenchmarkNames(localBenchmarksPath);
  }

  if (runRemote) {
    benchmarkPlan.remote = getBenchmarkNames(remoteBenchmarksPath);
  }

  return benchmarkPlan;
}

/**
 * Copy all benchmarks that should be run to the HTTP server root folder.
 * That allows serving both local and remote benchmarks simultaneously.
 */
async function prepareServerPublicFolder(benchmarkPlan) {
  console.log(chalk.gray(`- Preparing HTTP server public folder...`));

  await cleanDir(serverRootPath);

  if (!existsSync(serverRootPath)) {
    mkdirSync(serverRootPath);
  }

  if (benchmarkPlan.local) {
    // build the benchmarks
    for (let i = 0; i < benchmarkPlan.local.length; i++) {
      await buildBenchmark(
        localReactPath,
        localBenchmarksPath,
        benchmarkPlan.local[i]
      );
    }

    await copyBenchmarkToServerRoot(
      localBenchmarksPath,
      'local',
      benchmarkPlan.local
    );
  }

  if (benchmarkPlan.remote) {
    for (let i = 0; i < benchmarkPlan.remote.length; i++) {
      await buildBenchmark(
        remoteReactPath,
        remoteBenchmarksPath,
        benchmarkPlan.remote[i]
      );
    }
    await copyBenchmarkToServerRoot(
      remoteBenchmarksPath,
      'remote',
      benchmarkPlan.remote
    );
  }
}

/**
 * Copy benchmark folders from original path to the specified subfolder of the HTTP root folder.
 */
async function copyBenchmarkToServerRoot(
  fromPath,
  toSubfolder,
  benchmarkNames
) {
  const subfolderPath = join(serverRootPath, toSubfolder);
  if (!existsSync(subfolderPath)) {
    mkdirSync(subfolderPath);
  }

  for (let i = 0; i < benchmarkNames.length; i++) {
    const benchmarkName = benchmarkNames[i];
    await asyncCopyTo(
      join(localBenchmarksPath, benchmarkName),
      join(serverRootPath, toSubfolder, benchmarkName)
    );
  }
}

/**
 * Build interleaved queue for running benchmarks.
 * The goal is to mitigate external effects on benchmark results (such as another process consuming resources). The
 * solution is to run local and remote versions of the same benchmark one after another (to increase chances that both
 * benchmarks are affected similarly); at the same time individual runs of the same benchmark should be spaced out
 * to reduce chances of all runs of an individual benchmark being affected.
 */
function getBenchmarkQueueInterleaved(benchmarkPlan) {
  const queue = [];
  const queuePartLocal = benchmarkPlan.local
    ? benchmarkPlan.local.map(n => {
        return {
          source: 'local',
          benchmarkName: n,
        };
      })
    : [];

  const queuePartRemote = benchmarkPlan.remote
    ? benchmarkPlan.remote.map(n => {
        return {
          source: 'remote',
          benchmarkName: n,
        };
      })
    : [];

  const onePassQueue = _.orderBy(
    [...queuePartLocal, ...queuePartRemote],
    ['benchmarkName', 'asc'],
    ['source', 'asc']
  );

  for (let i = 0; i < timesToRun; i++) {
    onePassQueue.forEach(benchmark => {
      queue.push({
        source: benchmark.source,
        benchmarkName: benchmark.benchmarkName,
      });
    });
  }

  return queue;
}

/**
 * Build shuffled queue for running benchmarks.
 * Local and remote benchmarks are randomly interleaved, as well as individual runs of any individual benchmark.
 */
function getBenchmarkQueueRandom(benchmarkPlan) {
  const queue = [];

  // create a flat array of all benchmarks
  const shuffleBase = [];

  if (benchmarkPlan.local) {
    benchmarkPlan.local.forEach(benchmarkName => {
      shuffleBase.push({
        source: 'local',
        benchmarkName: benchmarkName,
        runsToQueue: timesToRun,
      });
    });
  }

  if (benchmarkPlan.remote) {
    benchmarkPlan.local.forEach(benchmarkName => {
      shuffleBase.push({
        source: 'remote',
        benchmarkName: benchmarkName,
        runsToQueue: timesToRun,
      });
    });
  }

  // build the queue, randomly picking one benchmark from shuffleBase
  while (shuffleBase.length > 0) {
    const randomIndex = Math.floor(Math.random() * shuffleBase.length);
    const benchmark = shuffleBase[randomIndex];

    queue.push({
      source: benchmark.source,
      benchmarkName: benchmark.benchmarkName,
    });

    benchmark.runsToQueue--;
    if (benchmark.runsToQueue === 0) {
      shuffleBase.splice(randomIndex, 1);
    }
  }

  return queue;
}

/**
 * Get benchmark names for the given folder, considering the filter parameter
 */
function getBenchmarkNames(benchmarksPath) {
  return readdirSync(benchmarksPath).filter(
    file =>
      statSync(join(benchmarksPath, file)).isDirectory() &&
      (!benchmarkFilter || file.indexOf(benchmarkFilter) !== -1)
  );
}

/**
 * Main benchmark runner function
 */
async function run() {
  if (runLocal && runRemote) {
    console.log(
      chalk.white.bold('Comparing ') +
        chalk.green.bold('Local (Current Branch)') +
        chalk.white.bold(' to ') +
        chalk.yellow.bold('Remote (Merge Base)')
    );
  } else if (runLocal) {
    console.log(
      chalk.white.bold('Running benchmarks for ') +
        chalk.green.bold('Local (Current Branch)')
    );
  } else if (runRemote) {
    console.log(
      chalk.white.bold('Running benchmarks for ') +
        chalk.yellow.bold('Remote (Merge Base)')
    );
  }

  await prepareReactBuilds();
  const benchmarkPlan = getBenchmarkPlan();
  await prepareServerPublicFolder(benchmarkPlan);

  let benchmarkQueue;
  if (runOrder === 'random') {
    benchmarkQueue = getBenchmarkQueueRandom(benchmarkPlan, timesToRun);
  } else {
    benchmarkQueue = getBenchmarkQueueInterleaved(benchmarkPlan, timesToRun);
  }

  const server = serveBenchmark(serverRootPath);
  await wait(1000);

  const results = await runBenchmarkQueue(benchmarkQueue, headless);

  await server.closeAsync();

  printResults(results.local, results.remote);
}

run().then(() => process.exit(0));
