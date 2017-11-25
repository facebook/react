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
    runYarnTask(cwd, 'lint-build', 'Lint bundle failed'), 
    'Running ESLint on bundle'
  );
  await logPromise(
    runYarnTask(cwd, 'flow', 'Flow failed'),
    'Running Flow checks'
  );
  await logPromise(
    runYarnTask(cwd, 'test', 'Jest tests failed in development'),
    'Running Jest tests in the development environment',
    true
  );
  await logPromise(
    runYarnTask(cwd, 'test-prod', 'Jest tests failed in production'),
    'Running Jest tests in the production environment',
    true
  );
  await logPromise(
    runYarnTask(cwd, 'test-build', 'Jest tests on the bundle failed in development'),
    'Running Jest tests on the bundle in the development environment',
    true
  );
  await logPromise(
    runYarnTask(cwd, 'test-build-prod', 'Jest tests on the bundle failed in production'),
    'Running Jest tests on the bundle in the production environment',
    true
  );
};
