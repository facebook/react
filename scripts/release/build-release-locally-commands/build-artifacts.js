#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {join} = require('path');
const {logPromise} = require('../utils');
const isWindows = require('is-windows');
const run = async ({cwd, dry, tempDirectory}) => {
  const defaultOptions = {
    cwd: tempDirectory,
  };

  await exec('yarn install', defaultOptions);
  await exec('yarn build -- --extract-errors', defaultOptions);

  const tempNodeModulesPath = join(tempDirectory, 'build', 'node_modules');
  const buildPath = join(cwd, 'build');

  if (isWindows()) {
    await exec(`xcopy /s /i ${tempNodeModulesPath} ${buildPath}`);
  } else {
    await exec(`cp -r ${tempNodeModulesPath} ${buildPath}`);
  }
};

module.exports = async params => {
  return logPromise(run(params), 'Building artifacts', 600000);
};
