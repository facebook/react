#!/usr/bin/env node

'use strict';

const {existsSync} = require('fs');
const {writeJson} = require('fs-extra');
const {join} = require('path');
const {getPackages, logPromise} = require('../utils');

const run = async ({branch, checksum, commit, tempDirectory}) => {
  const packages = getPackages(join(tempDirectory, 'packages'));
  const packagesDir = join(tempDirectory, 'packages');

  const buildInfoJSON = {
    branch,
    checksum,
    commit,
    environment: 'local',
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

module.exports = async params => {
  return logPromise(run(params), 'Adding build metadata to packages');
};
