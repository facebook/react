#!/usr/bin/env node

'use strict';

const {logPromise, runYarnTask} = require('../utils');

module.exports = async ({cwd}) => {
  await logPromise(
    runYarnTask(cwd, 'lint-build', 'Lint bundle failed'),
    'Running ESLint on bundle'
  );
  await logPromise(
    runYarnTask(
      cwd,
      'test-build',
      'Jest tests on the bundle failed in development'
    ),
    'Running Jest tests on the bundle in the development environment',
    true
  );
  await logPromise(
    runYarnTask(
      cwd,
      'test-build-prod',
      'Jest tests on the bundle failed in production'
    ),
    'Running Jest tests on the bundle in the production environment',
    true
  );
};
