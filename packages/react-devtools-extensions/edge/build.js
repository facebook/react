#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { isAbsolute, join, relative } = require('path');
const { argv } = require('yargs');
const build = require('../build');

const main = async () => {
  
  const { crx } = argv;

  await build('edge');


  if (crx) {

    const cwd = join(__dirname, 'build');

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
      `${crxPath} pack ./unpacked -o ReactDevTools.crx`,
      {
        cwd,
      }
    );
  }

  console.log(chalk.green('\nThe Microsoft Edge extension has been built!'));
  console.log(chalk.green('You can test this build by running:'));
  console.log(chalk.gray('\n# From the react-devtools root directory:'));
  console.log('yarn run test:edge');
};

main();
