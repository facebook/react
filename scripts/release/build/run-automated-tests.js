#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {logPromise} = require('../utils');

const runYarnTask = async (cwd, task, errorMessage) => {
  try {
    await exec(`yarn ${task}`, {cwd});
  } catch (error) {
    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red(errorMessage)}\n\n` +
        error.stdout
    );
    process.exit(1);
  }
};

module.exports = async ({cwd}) => {
  await logPromise(runYarnTask(cwd, 'lint', 'Lint failed'), 'Running ESLint');
  await logPromise(
    runYarnTask(cwd, 'flow', 'Flow failed'),
    'Running Flow checks'
  );
  await logPromise(
    runYarnTask(cwd, 'jest', 'Jest failed'),
    'Running Jest tests'
  );
};
