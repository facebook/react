#!/usr/bin/env node

const chalk = require('chalk');
const { join } = require('path');
const build = require('../shared/build');

const main = async () => {
  await build(
    'chrome',
    join(__dirname, 'manifest.json'),
    join(__dirname, 'build')
  );

  console.log(chalk.green('\nThe Chrome extension has been built!'));
  console.log(chalk.green('You can test this build by running:'));
  console.log(chalk.gray('\n# From the react-devtools root directory:'));
  console.log('yarn run test:chrome');
};

main();
