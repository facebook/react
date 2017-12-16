'use strict';

const Table = require('cli-table');
const filesize = require('filesize');
const chalk = require('chalk');
const join = require('path').join;
const fs = require('fs');
const prevBuildResults = require('./results.json');

const currentBuildResults = {
  // Mutated inside build.js during a build run.
  // We make a copy so that partial rebuilds don't erase other stats.
  bundleSizes: [...prevBuildResults.bundleSizes],
};

function saveResults() {
  fs.writeFileSync(
    join('scripts', 'rollup', 'results.json'),
    JSON.stringify(currentBuildResults, null, 2)
  );
}


function percentChange(prev, current) {
  return Math.floor((current - prev) / prev * 100);
}

function percentChangeString(change) {
  if (change > 0) {
    return chalk.red.bold(`+${change} %`);
  } else if (change <= 0) {
    return chalk.green.bold(change + ' %');
  }
}

const resultsHeaders = [
  'Bundle',
  'Prev Size',
  'Current Size',
  'Diff',
  'Prev Gzip',
  'Current Gzip',
  'Diff',
];

function generateResultsArray(current, prevResults) {
  currentBuildResults.bundleSizes.forEach(index => {
    const result = currentBuildResults.bundleSizes[index];
    const prev = prevBuildResults.bundleSizes.filter(
      res => res.filename === result.filename
    )[0];
    if (result === prev) {
      // We didn't rebuild this bundle.
      return;
    }

    const size = result.size;
    const gzip = result.gzip;
    let prevSize = prev ? prev.size : 0;
    let prevGzip = prev ? prev.gzip : 0;

    return [
      `${result.filename} (${result.bundleType}`, 
      filesize(prevSize),
      filesize(size),
      percentChange(prevSize, size),
      filesize(prevGzip),
      filesize(gzip),
      percentChange(prevGzip, gzip),
    ];
  // Strip any nulls
  }).filter(f => f);
}

function printResults() {
  const table = new Table({
    head: resultsHeaders.map(chalk.gray.yellow),
  });

  const results = generateResultsArray(currentBuildResults, prevBuildResults)
  results.forEach(row => {
    table.push([
      chalk.white.bold(row[0]),
      chalk.gray.bold(row[1]),
      chalk.white.bold(row[2]),
      percentChangeString(row[3]),
      chalk.gray.bold(row[4]),
      chalk.white.bold(row[5]),
      percentChangeString(row[6]),
    ]);
  });

  return table.toString();
}

module.exports = {
  currentBuildResults,
  generateResultsArray,
  printResults,
  saveResults,
  resultsHeaders,
};
