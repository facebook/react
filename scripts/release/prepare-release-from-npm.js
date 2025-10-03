#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {getPublicPackages, handleError} = require('./utils');

const checkOutPackages = require('./prepare-release-from-npm-commands/check-out-packages');
const parseParams = require('./prepare-release-from-npm-commands/parse-params');
const printPrereleaseSummary = require('./shared-commands/print-prerelease-summary');
const testPackagingFixture = require('./shared-commands/test-packaging-fixture');
const updateStableVersionNumbers = require('./prepare-release-from-npm-commands/update-stable-version-numbers');
const {stablePackages} = require('../../ReactVersions');

const run = async () => {
  try {
    const params = parseParams();
    params.cwd = join(__dirname, '..', '..');

    if (params.onlyPackages.length > 0 && params.skipPackages.length > 0) {
      console.error(
        '--onlyPackages and --skipPackages cannot be used together'
      );
      process.exit(1);
    }

    let packages = getPublicPackages();
    packages = packages.filter(packageName => {
      if (params.onlyPackages.length > 0) {
        return params.onlyPackages.includes(packageName);
      }
      return !params.skipPackages.includes(packageName);
    });

    const versions = stablePackages;

    await checkOutPackages(packages, versions, params);
    await updateStableVersionNumbers(packages, versions, params);

    if (!params.skipTests) {
      await testPackagingFixture(params);
    }

    await printPrereleaseSummary(params, true);
  } catch (error) {
    handleError(error);
  }
};

run();
