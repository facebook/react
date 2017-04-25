'use strict';

const chalk = require('chalk');
const Table = require('cli-table');

function percentChange(prev, current) {
  const change = Math.floor((current - prev) / prev * 100);

  if (change > 0) {
    return chalk.red(`+${change} %`);
  } else if (change <= 0) {
    return chalk.green(change + ' %');
  }
}

function addBenchmarkResults(table, localResults, remoteMasterResults) {
  const benchmarks = Object.keys(
    (localResults && localResults.benchmarks) || (remoteMasterResults && remoteMasterResults.benchmarks)
  );
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

    const measurements = (
      (localResults && localResults.benchmarks[benchmark].averages) 
      || 
      (remoteMasterResults && remoteMasterResults.benchmarks[benchmark].averages)
    );
    measurements.forEach((measurement, i) => {
      const row = [
        chalk.gray(measurement.entry),
      ];
      let remoteMean;
      if (remoteMasterResults) {
        remoteMean = remoteMasterResults.benchmarks[benchmark].averages[i].mean;
        row.push(chalk.white(remoteMean + ' ms'));
      }      
      let localMean;
      if (localResults) {
        localMean = localResults.benchmarks[benchmark].averages[i].mean;
        row.push(chalk.white(localMean + ' ms'));
      }
      if (localResults && remoteMasterResults) {
        row.push(percentChange(remoteMean, localMean));
      }
      table.push(row);
    });
  });
}

function addBundleSizeComparions(table, localResults, remoteMasterResults) {
  const bunldesRowHeader = [chalk.white.bold('Bundles')];
  if (remoteMasterResults) {
    bunldesRowHeader.push(chalk.white.bold('Size'));
  }    
  if (localResults) {
    bunldesRowHeader.push(chalk.white.bold('Size'));
  }
  if (localResults && remoteMasterResults) {
    bunldesRowHeader.push(chalk.white.bold('Diff'));
  }
  table.push(bunldesRowHeader);

  const bundles = Object.keys(
    (localResults && localResults.bundles.bundleSizes)
    || 
    (remoteMasterResults && remoteMasterResults.bundles.bundleSizes)
  );
  bundles.forEach(bundle => {
    const row = [
      chalk.gray(bundle),
    ];
    let remoteSize;
    if (remoteMasterResults) {
      remoteSize = remoteMasterResults.bundles.bundleSizes[bundle].size;
      row.push(chalk.white(remoteSize + ' kb'));
    }      
    let localSize;
    if (localResults) {
      localSize = localResults.bundles.bundleSizes[bundle].size;
      row.push(chalk.white(localSize + ' kb'));
    }
    if (localResults && remoteMasterResults) {
      row.push(percentChange(remoteSize, localSize));
    }    
    table.push(row);
  });
}

function printResults(localResults, remoteMasterResults) {
  const head = [''];
  if (remoteMasterResults) {
    head.push(chalk.yellow.bold('Remote Master'));
  }  
  if (localResults) {
    head.push(chalk.green.bold('Local (Current Branch)'));
  }
  if (localResults && remoteMasterResults) {
    head.push('');
  }
  const table = new Table({ head });

  addBundleSizeComparions(table, localResults, remoteMasterResults);
  addBenchmarkResults(table, localResults, remoteMasterResults);

  console.log(table.toString());
}

module.exports = printResults;
