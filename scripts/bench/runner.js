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
const chalk = require('chalk');
const Table = require('cli-table');

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

    console.log(chalk.gray(`- Running benchmark "${chalk.white(benchmarkName)}"`));
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

function printResults(localResults, remoteMasterResults) {
  const head = [
    chalk.white.bold('Profiles'),
  ];
  if (localResults) {
    head.push(chalk.green.bold('Local (Current Branch)'));
  }
  if (remoteMasterResults) {
    head.push(chalk.yellow.bold('Remote Master'));
  }
  const table = new Table({
    head,
  });
  const benchmarks = Object.keys(
    (localResults && localResults.benchmarks) || (remoteMasterResults && remoteMasterResults.benchmarks)
  );
  benchmarks.forEach(benchmark => {
    const rowHeader = [
      chalk.cyan(benchmark),
    ];
    if (localResults) {
      rowHeader.push('');
    }
    if (remoteMasterResults) {
      rowHeader.push('');
    }
    table.push(rowHeader);

    const measurements = (
      (localResults && localResults.benchmarks[benchmark].averages) 
      || 
      (remoteMasterResults && remoteMasterResults.benchmarks[benchmark].averages)
    );
    measurements.forEach((measurement, i) => {
      const row = [
        chalk.gray(measurement.entry),
      ];
      if (localResults) {
        row.push(chalk.white(localResults.benchmarks[benchmark].averages[i].mean + ' ms'));
      }
      if (remoteMasterResults) {
        row.push(chalk.white(remoteMasterResults.benchmarks[benchmark].averages[i].mean + ' ms'));
      }
      table.push(row);
    });
  });
  // if (localResults) {
  //   console.log(
  //     chalk.green.bold('\n- Local (Current Branch)')
  //     + chalk.white.bold(' Results:\n')
  //   );
  //   for (let benchmark in localResults.benchmarks) {
  //     console.log(localResults.benchmarks[benchmark].averages);
  //   }
  // }
  // if (remoteMasterResults) {
  //   console.log(
  //     chalk.yellow.bold('\n- Remote Master')
  //     + chalk.white.bold(' Results:\n')
  //   );
  //   for (let benchmark in remoteMasterResults.benchmarks) {
  //     console.log(remoteMasterResults.benchmarks[benchmark].averages);
  //   }
  // }
  console.log(table.toString());
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
