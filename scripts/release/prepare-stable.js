#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {getPublicPackages, handleError} = require('./utils');

const checkOutPackages = require('./prepare-stable-commands/check-out-packages');
const confirmStableVersionNumbers = require('./prepare-stable-commands/confirm-stable-version-numbers');
const guessStableVersionNumbers = require('./prepare-stable-commands/guess-stable-version-numbers');
const parseParams = require('./prepare-stable-commands/parse-params');
const printPrereleaseSummary = require('./shared-commands/print-prerelease-summary');
const testPackagingFixture = require('./shared-commands/test-packaging-fixture');
const testTracingFixture = require('./shared-commands/test-tracing-fixture');
const updateStableVersionNumbers = require('./prepare-stable-commands/update-stable-version-numbers');

const run = async () => {
  try {
    const params = parseParams();
    params.cwd = join(__dirname, '..', '..');
    params.packages = await getPublicPackages();

    // Map of package name to upcoming stable version.
    // This Map is initially populated with guesses based on local versions.
    // The developer running the release later confirms or overrides each version.
    const versionsMap = new Map();

    await checkOutPackages(params);
    await guessStableVersionNumbers(params, versionsMap);
    await confirmStableVersionNumbers(params, versionsMap);
    await updateStableVersionNumbers(params, versionsMap);

    if (!params.skipTests) {
      await testPackagingFixture(params);
      await testTracingFixture(params);
    }

    await printPrereleaseSummary(params);
  } catch (error) {
    handleError(error);
  }
};

run();
