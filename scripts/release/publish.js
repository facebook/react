#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const logUpdate = require('log-update');

// Follows the steps outlined in github.com/facebook/react/issues/10620
const run = async () => {
  // TODO Parse params (if we need them?)

  try {
    // TODO Verify update to CHANGELOG.md and commit
    // TODO git push / git push --tags
    // TODO build/packages ~ npm publish
    // TODO npm info <package> dist-tags
    // TODO Update bower
    // TODO Print post-publish website update instructions
    // TODO Print post-publish testing instructions
  } catch (error) {
    logUpdate.clear();

    console.log(`${chalk.bgRed.white(' ERROR ')} ${chalk.red(error.message)}`);

    process.exit(1);
  }
};

run();
