#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {dependencies} = require('../config');
const {execRead, logPromise} = require('../utils');

const update = async ({cwd, dry, version}) => {
  await exec(`yarn upgrade ${dependencies.join(' ')}`, {cwd});

  const modifiedFiles = await execRead('git ls-files -m', {cwd});

  // If yarn.lock has changed we should commit it.
  // If anything else has changed, it's an error.
  if (modifiedFiles) {
    if (modifiedFiles !== 'yarn.lock') {
      console.log(
        `${chalk.bgRed.white(' ERROR ')} ${chalk.red('Unexpected modifications')}\n\n` +
          `The following files have been modified unexpectedly:\n` +
          chalk.gray(modifiedFiles)
      );
      process.exit(1);
    }

    if (!dry) {
      await exec(
        `git commit -am "Updating yarn.lock file for ${version} release"`,
        {cwd}
      );
    }
  }
};

module.exports = async params => {
  return logPromise(update(params), 'Upgrading NPM dependencies');
};
