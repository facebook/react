#!/usr/bin/env node

const chalk = require('chalk');
const { execSync } = require('child_process');
const { join } = require('path');
const build = require('../shared/build');

const main = async () => {
  await build('chrome');

  const cwd = join(__dirname, 'build');
  execSync('crx pack ./unpacked -o ReactDevTools.crx -p ../../../../key.pem', {
    cwd,
  });
  execSync('rm packed.zip', { cwd });

  console.log(chalk.green('\nThe Chrome extension has been built!'));
  console.log(chalk.green('You can test this build by running:'));
  console.log(chalk.gray('\n# From the react-devtools root directory:'));
  console.log('yarn run test:chrome');
};

main();
