#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const logUpdate = require('log-update');

const buildArtifacts = require('./build/build-artifacts');
const checkCircleCiStatus = require('./build/check-circle-ci-status');
const checkEnvironmentVariables = require('./build/check-environment-variables');
const checkNpmPermissions = require('./build/check-npm-permissions');
const checkPackageDependencies = require('./build/check-package-dependencies');
const checkUncommittedChanges = require('./build/check-uncommitted-changes');
const installYarnDependencies = require('./build/install-yarn-dependencies');
const parseBuildParameters = require('./build/parse-build-parameters');
const printPrereleaseInstructions = require('./build/print-prerelease-instructions');
const runAutomatedTests = require('./build/run-automated-tests');
const updateGit = require('./build/update-git');
const updatePackageVersions = require('./build/update-package-versions');
const updateYarnDependencies = require('./build/update-yarn-dependencies');

// Follows the steps outlined in github.com/facebook/react/issues/10620
const run = async () => {
  const params = parseBuildParameters();

  try {
    await checkEnvironmentVariables(params);
    await checkUncommittedChanges(params);
    await checkNpmPermissions(params);
    await updateGit(params);
    await checkCircleCiStatus(params);
    await installYarnDependencies(params);
    await checkPackageDependencies(params);
    await updateYarnDependencies(params);
    await runAutomatedTests(params);
    await updatePackageVersions(params);
    await buildArtifacts(params);
    await printPrereleaseInstructions();
  } catch (error) {
    logUpdate.clear();

    console.log(`${chalk.bgRed.white(' ERROR ')} ${chalk.red(error.message)}`);

    process.exit(1);
  }
};

run();
