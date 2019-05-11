#!/usr/bin/env node

'use strict';

// This script is run by Circle CI (see ../scripts/circleci).
// It is not meant to be run as part of the local build or publish process.
// It exists to share code between the Node release scripts and CI bash scripts.

const {exec} = require('child_process');
const {join} = require('path');

const run = async () => {
  const {getBuildInfo, updateVersionsForCanary} = require('./utils');

  const cwd = join(__dirname, '..', '..');

  const {reactVersion, version} = await getBuildInfo();

  await updateVersionsForCanary(cwd, reactVersion, version);
};

// Install (or update) release script dependencies before proceeding.
// This needs to be done before we require() the first NPM module.
exec('yarn install', {cwd: __dirname}, (error, stdout, stderr) => {
  if (error) {
    console.error(error);
    process.exit(1);
  } else {
    run();
  }
});
