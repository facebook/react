'use strict';
const _ = require('lodash');
const chalk = require('chalk');
const Table = require('cli-table');

function percentChange(prev, current, prevSem, currentSem) {
  const [mean, sd] = calculateMeanAndSdOfRatioFromDeltaMethod(
    prev,
    current,
    prevSem,
    currentSem
  );
  const pctChange = +(mean * 100).toFixed(1);
  const ci95 = +(100 * 1.96 * sd).toFixed(1);

  const ciInfo = ci95 > 0 ? ` +- ${ci95} %` : '';
  const text = `${pctChange > 0 ? '+' : ''}${pctChange} %${ciInfo}`;
  if (pctChange + ci95 < 0) {
    return chalk.green(text);
  } else if (pctChange - ci95 > 0) {
    return chalk.red(text);
  } else {
    // Statistically insignificant.
    return text;
  }
}

function calculateMeanAndSdOfRatioFromDeltaMethod(
  meanControl,
  meanTest,
  semControl,
  semTest
) {
  const mean =
    (meanTest - meanControl) / meanControl -
    (Math.pow(semControl, 2) * meanTest) / Math.pow(meanControl, 3);
  const variance =
    Math.pow(semTest / meanControl, 2) +
    Math.pow(semControl * meanTest, 2) / Math.pow(meanControl, 4);
  return [mean, Math.sqrt(variance)];
}

function addBenchmarkResults(table, localResults, remoteMasterResults) {
  // union local and remote benchmarks to support missing benchmarks on either side
  const benchmarks = _.union(
    localResults ? Object.keys(localResults) : [],
    remoteMasterResults ? Object.keys(remoteMasterResults) : []
  ).sort();

  benchmarks.forEach(benchmark => {
    const rowHeader = [chalk.white.bold(benchmark)];
    if (remoteMasterResults) {
      rowHeader.push(chalk.white.bold('Time'));
    }
    if (localResults) {
      rowHeader.push(chalk.white.bold('Time'));
    }
    if (localResults && remoteMasterResults) {
      rowHeader.push(chalk.white.bold('Diff'));
    }
    table.push(rowHeader);

    const measurements =
      (localResults &&
        localResults[benchmark] &&
        localResults[benchmark].averages) ||
      (remoteMasterResults &&
        remoteMasterResults[benchmark] &&
        remoteMasterResults[benchmark].averages);
    measurements.forEach((measurement, i) => {
      const row = [chalk.gray(measurement.entry)];
      let remoteMean;
      let remoteSem;
      if (remoteMasterResults) {
        if (remoteMasterResults[benchmark]) {
          remoteMean = remoteMasterResults[benchmark].averages[i].mean;
          remoteSem = remoteMasterResults[benchmark].averages[i].sem;
          // https://en.wikipedia.org/wiki/1.96 gives a 99% confidence interval.
          const ci95 = remoteSem * 1.96;
          row.push(
            chalk.white(+remoteMean.toFixed(2) + ' ms +- ' + ci95.toFixed(2))
          );
        } else {
          row.push(chalk.gray('N/A'));
        }
      }
      let localMean;
      let localSem;
      if (localResults) {
        if (localResults[benchmark]) {
          localMean = localResults[benchmark].averages[i].mean;
          localSem = localResults[benchmark].averages[i].sem;
          const ci95 = localSem * 1.96;
          row.push(
            chalk.white(+localMean.toFixed(2) + ' ms +- ' + ci95.toFixed(2))
          );
        } else {
          row.push(chalk.gray('N/A'));
        }
      }
      if (localResults && remoteMasterResults) {
        if (localResults[benchmark] && remoteMasterResults[benchmark]) {
          row.push(percentChange(remoteMean, localMean, remoteSem, localSem));
        } else {
          row.push(chalk.gray('N/A'));
        }
      }
      table.push(row);
    });
  });
}

function printResults(localResults, remoteMasterResults) {
  const head = [''];
  if (remoteMasterResults) {
    head.push(chalk.yellow.bold('Remote (Merge Base)'));
  }
  if (localResults) {
    head.push(chalk.green.bold('Local (Current Branch)'));
  }
  if (localResults && remoteMasterResults) {
    head.push('');
  }
  const table = new Table({head});
  addBenchmarkResults(table, localResults, remoteMasterResults);
  console.log(table.toString());
}

module.exports = printResults;
