'use strict';

const Table = require('cli-table');
const filesize = require('filesize');
const chalk = require('chalk');
const join = require('path').join;
const fs = require('fs');
const prevBuildResults = require('./results.json');

const currentBuildResults = {
  // Mutated inside build.js during a build run.
  bundleSizes: [],
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
  return table.toString();
}

module.exports = {
  printResults,
  saveResults,
  currentBuildResults,
};
