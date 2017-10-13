#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const logUpdate = require('log-update');

const buildArtifacts = require('./commands/build-artifacts');
const checkCircleCiStatus = require('./commands/check-circle-ci-status');
const checkEnvironmentVariables = require('./commands/check-environment-variables');
const checkNpmPermissions = require('./commands/check-npm-permissions');
const checkPackageDependencies = require('./commands/check-package-dependencies');
const checkUncommittedChanges = require('./commands/check-uncommitted-changes');
const installYarnDependencies = require('./commands/install-yarn-dependencies');
const parseParameters = require('./commands/parse-parameters');
const printChangelogInstructions = require('./commands/print-changelog-instructions');
const runAutomatedTests = require('./commands/run-automated-tests');
const updateGit = require('./commands/update-git');
const updatePackageVersions = require('./commands/update-package-versions');
const updateYarnDependencies = require('./commands/update-yarn-dependencies');

// Follows the steps outlined in github.com/facebook/react/issues/10620
const run = async () => {
  const params = parseParameters();

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
    await printChangelogInstructions();
    // TODO Print testing instructions
    // TODO Print publish instructions (and create separate publish.js script)
    // TODO Update website (instructions)
    // TODO Update bower
    // TODO Test via create-react-app
  } catch (error) {
    logUpdate.clear();

    console.log(`${chalk.bgRed.white(' ERROR ')} ${chalk.red(error.message)}`);

    process.exit(1);
  }
};

run();
