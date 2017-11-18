#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {execRead, execUnlessDry, logPromise} = require('../utils');

const run = async ({cwd, dry, version}) => {
  await exec('yarn build -- --extract-errors', {cwd});

  const modifiedFiles = await execRead('git ls-files -m', {cwd});

  if (modifiedFiles.includes('scripts/error-codes/codes.json')) {
    await execUnlessDry('git add scripts/error-codes/codes.json', {cwd, dry});
    await execUnlessDry(
      `git commit -m "Update error codes for ${version} release"`,
      {cwd, dry}
    );
  }

  if (modifiedFiles.includes('scripts/rollup/results.json')) {
    await execUnlessDry('git add scripts/rollup/results.json', {cwd, dry});
    await execUnlessDry(
      `git commit -m "Update bundle sizes for ${version} release"`,
      {cwd, dry}
    );
  }
};

module.exports = async params => {
  return logPromise(run(params), 'Building artifacts', true);
};
