#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {getPublicPackages, handleError} = require('./utils');

const checkOutPackages = require('./prepare-release-from-npm-commands/check-out-packages');
const confirmStableVersionNumbers = require('./prepare-release-from-npm-commands/confirm-stable-version-numbers');
const getLatestNextVersion = require('./prepare-release-from-npm-commands/get-latest-next-version');
const guessStableVersionNumbers = require('./prepare-release-from-npm-commands/guess-stable-version-numbers');
const parseParams = require('./prepare-release-from-npm-commands/parse-params');
const printPrereleaseSummary = require('./shared-commands/print-prerelease-summary');
const testPackagingFixture = require('./shared-commands/test-packaging-fixture');
const updateStableVersionNumbers = require('./prepare-release-from-npm-commands/update-stable-version-numbers');
const theme = require('./theme');

const run = async () => {
  try {
    const params = parseParams();
    params.cwd = join(__dirname, '..', '..');

    const isExperimental = params.version.includes('experimental');

    if (!params.version) {
      params.version = await getLatestNextVersion();
    }

    if (params.onlyPackages.length > 0 && params.skipPackages.length > 0) {
      console.error(
        '--onlyPackages and --skipPackages cannot be used together'
      );
      process.exit(1);
    }

    params.packages = await getPublicPackages(isExperimental);
    params.packages = params.packages.filter(packageName => {
      if (params.onlyPackages.length > 0) {
        return params.onlyPackages.includes(packageName);
      }
      return !params.skipPackages.includes(packageName);
    });

    // Map of package name to upcoming stable version.
    // This Map is initially populated with guesses based on local versions.
    // The developer running the release later confirms or overrides each version.
    const versionsMap = new Map();

    if (isExperimental) {
      console.error(
        theme.error`Cannot promote an experimental build to stable.`
      );
      process.exit(1);
    }

    await checkOutPackages(params);
    await guessStableVersionNumbers(params, versionsMap);
    await confirmStableVersionNumbers(params, versionsMap);
    await updateStableVersionNumbers(params, versionsMap);

    if (!params.skipTests) {
      await testPackagingFixture(params);
    }

    await printPrereleaseSummary(params, true);
  } catch (error) {
    handleError(error);
  }
};

run();
