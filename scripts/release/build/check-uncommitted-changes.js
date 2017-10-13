#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {execRead} = require('../utils');

module.exports = async ({cwd}) => {
  const status = await execRead('git diff HEAD', {cwd});

  if (status) {
    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red('Uncommitted local changes')}\n\n` +
        'Please revert or commit all local changes before making a release.'
    );
    process.exit(1);
  }
};
