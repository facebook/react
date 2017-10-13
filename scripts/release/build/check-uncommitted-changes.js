#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {execRead} = require('../utils');

module.exports = async ({cwd}) => {
  const status = await execRead('git diff HEAD', {cwd});

  if (status) {
    throw Error(
      chalk`
      Uncommitted local changes

      {white Please revert or commit all local changes before making a release.}
    `
    );
  }
};
