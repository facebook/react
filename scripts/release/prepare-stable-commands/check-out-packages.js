#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {join} = require('path');
const {logPromise} = require('../utils');
const theme = require('../theme');

const run = async ({cwd, packages, version}) => {
  // Cleanup from previous builds
  await exec(`rm -rf ./build/node_modules*`, {cwd});
  await exec(`mkdir ./build/node_modules`, {cwd});

  const nodeModulesPath = join(cwd, 'build/node_modules');

  // Checkout canary release from NPM for all local packages
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    await exec(`npm i ${packageName}@${version}`, {cwd: nodeModulesPath});
  }
};

module.exports = async params => {
  return logPromise(
    run(params),
    theme`Checking out canary from NPM {version ${params.version}}`
  );
};
