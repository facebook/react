'use strict';

const Table = require('cli-table');
const filesize = require('filesize');
const branch = require('git-branch');
const chalk = require('chalk');
const join = require('path').join;
const fs = require('fs');
const prevBuildResults = require('./results.json');

const currentBuildResults = {
  branch: branch.sync(),
  // Mutated during the build.
  bundleSizes: Object.assign({}, prevBuildResults.bundleSizes),
};

function saveResults() {
  fs.writeFileSync(
    join('scripts', 'rollup', 'results.json'),
    JSON.stringify(currentBuildResults, null, 2)
  );
}

function percentChange(prev, current) {
  const change = Math.floor((current - prev) / prev * 100);

  if (change > 0) {
    return chalk.red.bold(`+${change} %`);
  } else if (change <= 0) {
    return chalk.green.bold(change + ' %');
  }
}

function printResults() {
  const table = new Table({
    head: [
      chalk.gray.yellow('Bundle'),
      chalk.gray.yellow('Prev Size'),
      chalk.gray.yellow('Current Size'),
      chalk.gray.yellow('Diff'),
      chalk.gray.yellow('Prev Gzip'),
      chalk.gray.yellow('Current Gzip'),
      chalk.gray.yellow('Diff'),
    ],
  });
  Object.keys(currentBuildResults.bundleSizes).forEach(key => {
    const result = currentBuildResults.bundleSizes[key];
    const prev = prevBuildResults.bundleSizes[key];
    if (result === prev) {
      // We didn't rebuild this bundle.
      return;
    }

    const size = result.size;
    const gzip = result.gzip;
    let prevSize = prev ? prev.size : 0;
    let prevGzip = prev ? prev.gzip : 0;
    table.push([
      chalk.white.bold(key),
      chalk.gray.bold(filesize(prevSize)),
      chalk.white.bold(filesize(size)),
      percentChange(prevSize, size),
      chalk.gray.bold(filesize(prevGzip)),
      chalk.white.bold(filesize(gzip)),
      percentChange(prevGzip, gzip),
    ]);
  });
  return (
    table.toString() +
    `\n\nThe difference was compared to the last build on "${chalk.green.bold(prevBuildResults.branch)}" branch.\n`
  );
}

module.exports = {
  printResults,
  saveResults,
  currentBuildResults,
};
