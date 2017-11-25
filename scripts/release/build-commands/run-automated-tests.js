#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {logPromise} = require('../utils');

const runYarnTask = async (cwd, task, errorMessage) => {
  try {
    await exec(`yarn ${task}`, {cwd});
  } catch (error) {
    throw Error(
      chalk`
      ${errorMessage}

      {white ${error.stdout}}
    `
    );
  }
};

module.exports = async ({cwd}) => {
  await logPromise(runYarnTask(cwd, 'lint', 'Lint failed'), 'Running ESLint');
  await logPromise(
    runYarnTask(cwd, 'lint-build', 'Lint build failed'), 
    'Running ESLint on build'
  );
  await logPromise(
    runYarnTask(cwd, 'flow', 'Flow failed'),
    'Running Flow checks'
  );
  await logPromise(
    runYarnTask(cwd, 'test', 'Development Jest tests failed'),
    'Running development Jest tests',
    true
  );
  await logPromise(
    runYarnTask(cwd, 'test-prod', 'Production Jest tests failed'),
    'Running production Jest tests',
    true
  );
  await logPromise(
    runYarnTask(cwd, 'test-build', 'Development build Jest tests failed'),
    'Running development build Jest tests',
    true
  );
  await logPromise(
    runYarnTask(cwd, 'test-build-prod', 'Production build Jest tests failed'),
    'Running production build Jest tests',
    true
  );
};
