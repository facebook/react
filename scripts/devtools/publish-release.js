#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const { exec } = require('child-process-promise');
const { readJsonSync } = require('fs-extra');
const inquirer = require('inquirer');
const { join, relative } = require('path');
const { DRY_RUN, NPM_PACKAGES, ROOT_PATH } = require('./configuration');
const {
  checkNPMPermissions,
  clear,
  confirm,
  execRead,
  logger,
  readSavedBuildMetadata,
} = require('./utils');

async function main() {
  clear();

  await verifyBuildAndTest();

  const { archivePath, buildID } = readSavedBuildMetadata();

  await checkNPMPermissions();

  await publishToNPM();

  await printFinalInstructions(buildID, archivePath);
}

async function verifyBuildAndTest() {
  await confirm('Have you run the build-and-test script?', promptForBuildAndTest);
}

function promptForBuildAndTest() {
  const buildAndTestScriptPath = join(__dirname, 'build-and-test.js');
  const relativePath = relative(process.cwd(), buildAndTestScriptPath);

  console.log('Begin by running the build-and-test script:');
  console.log(chalk.bold.green('  ' + relativePath));
}

// ... other functions ...

main().catch((error) => {
  console.error(chalk.red('An error occurred:'), error);
  process.exit(1);
});
