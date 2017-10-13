#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {execRead, logPromise} = require('../utils');

const run = async ({cwd, dry, version}) => {
  await exec('yarn build -- --extract-errors', {cwd});

  const modifiedFiles = await execRead('git ls-files -m', {cwd});

  if (!dry) {
    if (modifiedFiles.includes('scripts/error-codes/codes.json')) {
      await exec('git add scripts/error-codes/codes.json', {cwd});
      await exec(`git commit -m "Update error codes for ${version} release"`, {
        cwd,
      });
    }

    if (modifiedFiles.includes('scripts/rollup/results.json')) {
      await exec('git add scripts/rollup/results.json', {cwd});
      await exec(`git commit -m "Update bundle sizes for ${version} release"`, {
        cwd,
      });
    }
  }
};

module.exports = async params => {
  return logPromise(run(params), 'Building artifacts');
};
