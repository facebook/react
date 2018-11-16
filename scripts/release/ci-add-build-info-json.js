#!/usr/bin/env node

'use strict';

// This script is run by Circle CI (see ../scripts/circleci).
// It is not meant to be run as part of the local build or publish process.
// It exists to share code between the Node release scripts and CI bash scripts.

const {exec} = require('child_process');
const {existsSync} = require('fs');
const {join} = require('path');

const run = async () => {
  const {writeJson} = require('fs-extra');
  const {getBuildInfo, getPackages} = require('./utils');

  const cwd = join(__dirname, '..', '..');

  const {checksum, commit, branch} = await getBuildInfo();

  const packages = getPackages(join(cwd, 'packages'));
  const packagesDir = join(cwd, 'packages');

  const buildInfoJSON = {
    branch,
    checksum,
    commit,
    environment: 'ci',
  };

  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packagePath = join(packagesDir, packageName);

    // Add build info JSON to package
    if (existsSync(join(packagePath, 'npm'))) {
      const buildInfoJSONPath = join(packagePath, 'npm', 'build-info.json');
      await writeJson(buildInfoJSONPath, buildInfoJSON, {spaces: 2});
    }
  }
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
