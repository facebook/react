#!/usr/bin/env node

'use strict';

const {exec} = require('child_process');
const {join} = require('path');

const run = async () => {
  const {getBuildInfo, updateVersionsForCanary} = require('./utils');

  const cwd = join(__dirname, '..', '..');

  const {version} = await getBuildInfo();

  await updateVersionsForCanary(cwd, version);
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
