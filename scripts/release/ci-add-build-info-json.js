#!/usr/bin/env node

'use strict';

// This script is run by Circle CI (see ../scripts/circleci).
// It is not meant to be run as part of the local build or publish process.
// It exists to share code between the Node release scripts and CI bash scripts.

// IMPORTANT:
// Changes below should be mirrored in ./create-canary-commands/add-build-info-json.js

const {exec} = require('child_process');
const {existsSync} = require('fs');
const {join} = require('path');

const run = async () => {
  const {writeJson, readJson} = require('fs-extra');
  const {getBuildInfo, getPublicPackages} = require('./utils');

  const cwd = join(__dirname, '..', '..');

  const {
    branch,
    buildNumber,
    checksum,
    commit,
    reactVersion,
  } = await getBuildInfo();

  const packages = getPublicPackages(join(cwd, 'packages'));
  const packagesDir = join(cwd, 'packages');

  const buildInfoJSON = {
    branch,
    buildNumber,
    checksum,
    commit,
    environment: 'ci',
    reactVersion,
  };

  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packagePath = join(packagesDir, packageName);
    const packageJSON = await readJson(join(packagePath, 'package.json'));

    // Verify all public packages include "build-info.json" in the files array.
    if (!packageJSON.files.includes('build-info.json')) {
      console.error(
        `${packageName} must include "build-info.json" in files array.`
      );
      process.exit(1);
    }

    // Add build info JSON to package.
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
