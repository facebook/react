#!/usr/bin/env node

'use strict';

const {logPromise, runYarnTask} = require('../utils');

module.exports = async ({cwd}) => {
  // await logPromise(runYarnTask(cwd, 'lint', 'Lint failed'), 'Running ESLint');
  await logPromise(
    runYarnTask(cwd, 'flow-ci', 'Flow failed'),
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
};
