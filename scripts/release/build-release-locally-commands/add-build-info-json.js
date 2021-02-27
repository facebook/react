#!/usr/bin/env node

'use strict';

// IMPORTANT:
// Changes below should be mirrored in ../ci-add-build-info-json.js

const {existsSync} = require('fs');
const {writeJson, readJson} = require('fs-extra');
const {join} = require('path');
const {getPublicPackages, logPromise} = require('../utils');
const theme = require('../theme');

const run = async ({branch, checksum, commit, reactVersion, tempDirectory}) => {
  const isExperimental = reactVersion.includes('experimental');
  const packages = getPublicPackages(isExperimental);
  const packagesDir = join(tempDirectory, 'packages');

  const buildInfoJSON = {
    branch,
    buildNumber: null,
    checksum,
    commit,
    environment: 'local',
    reactVersion,
  };

  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packagePath = join(packagesDir, packageName);
    const packageJSON = await readJson(join(packagePath, 'package.json'));

    // Verify all public packages include "build-info.json" in the files array.
    if (!packageJSON.files.includes('build-info.json')) {
      console.error(
        theme`{error ${packageName} must include "build-info.json" in files array.}`
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

module.exports = async params => {
  return logPromise(run(params), 'Adding build metadata to packages');
};
