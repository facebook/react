#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const logUpdate = require('log-update');

const buildArtifacts = require('./build-commands/build-artifacts');
const checkCircleCiStatus = require('./build-commands/check-circle-ci-status');
const checkEnvironmentVariables = require('./build-commands/check-environment-variables');
const checkNpmPermissions = require('./build-commands/check-npm-permissions');
const checkPackageDependencies = require('./build-commands/check-package-dependencies');
const checkUncommittedChanges = require('./build-commands/check-uncommitted-changes');
const installYarnDependencies = require('./build-commands/install-yarn-dependencies');
const parseBuildParameters = require('./build-commands/parse-build-parameters');
const printPostBuildSummary = require('./build-commands/print-post-build-summary');
const runAutomatedTests = require('./build-commands/run-automated-tests');
const updateGit = require('./build-commands/update-git');
const updatePackageVersions = require('./build-commands/update-package-versions');
const updateYarnDependencies = require('./build-commands/update-yarn-dependencies');
const validateVersion = require('./build-commands/validate-version');

// Follows the steps outlined in github.com/facebook/react/issues/10620
const run = async () => {
  try {
    const params = parseBuildParameters();

    await checkEnvironmentVariables(params);
    await validateVersion(params);
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
    await printPostBuildSummary(params);
  } catch (error) {
    logUpdate.clear();

    const message = error.message.trim().replace(/\n +/g, '\n');
    const stack = error.stack.replace(error.message, '');

    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red(message)}\n\n${chalk.gray(stack)}`
    );

    process.exit(1);
  }
};

run();
