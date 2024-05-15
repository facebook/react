#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {execSync} = require('child_process');
const {existsSync} = require('fs');
const {isAbsolute, join, relative} = require('path');
const {argv} = require('yargs');
const build = require('../build');

const main = async () => {
  const {crx, keyPath} = argv;

  if (crx) {
    if (!keyPath || !existsSync(keyPath)) {
      console.error('Must specify a key file (.pem) to build CRX');
      process.exit(1);
    }
  }

  await build('chrome');

  if (crx) {
    const cwd = join(__dirname, 'build');

    let safeKeyPath = keyPath;
    if (!isAbsolute(keyPath)) {
      safeKeyPath = join(relative(cwd, process.cwd()), keyPath);
    }

    const crxPath = join(
      __dirname,
      '..',
      '..',
      '..',
      'node_modules',
      '.bin',
      'crx'
    );

    execSync(
      `${crxPath} pack ./unpacked -o ReactDevTools.crx -p ${safeKeyPath}`,
      {
        cwd,
      }
    );
  }

  console.log(chalk.green('\nThe Chrome extension has been built!'));
  console.log(chalk.green('You can test this build by running:'));
  console.log(chalk.gray('\n# From the react-devtools root directory:'));
  console.log('yarn run test:chrome');
};

main();
