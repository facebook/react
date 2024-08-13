#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const chalk = require('chalk');
const {join} = require('path');
const semver = require('semver');
const yargs = require('yargs');
const fs = require('fs');

const INSTALL_PACKAGES = ['react-dom', 'react', 'react-test-renderer'];
const REGRESSION_FOLDER = 'build-regression';

const ROOT_PATH = join(__dirname, '..', '..');

const buildPath = join(ROOT_PATH, `build`, 'oss-experimental');
const regressionBuildPath = join(ROOT_PATH, REGRESSION_FOLDER);

const argv = yargs(process.argv.slice(2)).argv;

const version = process.argv[2];
const shouldReplaceBuild = !!argv.replaceBuild;

async function downloadRegressionBuild() {
  console.log(chalk.bold.white(`Downloading React v${version}\n`));

  // Make build directory for temporary modules we're going to download
  // from NPM
  console.log(
    chalk.white(
      `Make Build directory at ${chalk.underline.blue(regressionBuildPath)}\n`
    )
  );
  await exec(`mkdir ${regressionBuildPath}`);

  // Install all necessary React packages that have the same version
  const downloadPackagesStr = INSTALL_PACKAGES.reduce(
    (str, name) => `${str} ${name}@${version}`,
    ''
  );
  await exec(
    `npm install --prefix ${REGRESSION_FOLDER} ${downloadPackagesStr}`
  );

  // If we shouldn't replace the build folder, we can stop here now
  // before we modify anything
  if (!shouldReplaceBuild) {
    return;
  }

  // Remove all the packages that we downloaded in the original build folder
  // so we can move the modules from the regression build over
  const removePackagesStr = INSTALL_PACKAGES.reduce(
    (str, name) => `${str} ${join(buildPath, name)}`,
    ''
  );
  console.log(
    chalk.white(
      `Removing ${removePackagesStr
        .split(' ')
        .map(str => chalk.underline.blue(str) + '\n')
        .join(' ')}\n`
    )
  );
  await exec(`rm -r ${removePackagesStr}`);

  // Move all packages that we downloaded to the original build folder
  // We need to separately move the scheduler package because it might
  // be called schedule
  const movePackageString = INSTALL_PACKAGES.reduce(
    (str, name) => `${str} ${join(regressionBuildPath, 'node_modules', name)}`,
    ''
  );
  console.log(
    chalk.white(
      `Moving ${movePackageString
        .split(' ')
        .map(str => chalk.underline.blue(str) + '\n')
        .join(' ')} to ${chalk.underline.blue(buildPath)}\n`
    )
  );
  await exec(`mv ${movePackageString} ${buildPath}`);

  // For React versions earlier than 18.0.0, we explicitly scheduler v0.20.1, which
  // is the first version that has unstable_mock, which DevTools tests need, but also
  // has Scheduler.unstable_trace, which, although we don't use in DevTools tests
  // is imported by older React versions and will break if it's not there
  if (semver.lte(semver.coerce(version).version, '18.0.0')) {
    await exec(`npm install --prefix ${REGRESSION_FOLDER} scheduler@0.20.1`);
  }

  // In v16.5, scheduler is called schedule. We need to make sure we also move
  // this over. Otherwise the code will break.
  if (fs.existsSync(join(regressionBuildPath, 'node_modules', 'schedule'))) {
    console.log(chalk.white(`Downloading schedule\n`));
    await exec(
      `mv ${join(regressionBuildPath, 'node_modules', 'schedule')} ${buildPath}`
    );
  } else {
    console.log(chalk.white(`Downloading scheduler\n`));
    await exec(`rm -r ${join(buildPath, 'scheduler')}`);
    await exec(
      `mv ${join(
        regressionBuildPath,
        'node_modules',
        'scheduler'
      )} ${buildPath}`
    );
  }
}

async function main() {
  try {
    if (!version) {
      console.log(chalk.red('Must specify React version to download'));
      return;
    }
    await downloadRegressionBuild();
  } catch (e) {
    console.log(chalk.red(e));
  } finally {
    // We shouldn't remove the regression-build folder unless we're using
    // it to replace the build folder
    if (shouldReplaceBuild) {
      console.log(chalk.bold.white(`Removing regression build`));
      await exec(`rm -r ${regressionBuildPath}`);
    }
  }
}

main();
