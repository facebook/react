#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {execRead, logPromise} = require('../utils');

const update = async ({cwd, dry, version}) => {
  const modifiedFiles = await execRead('git ls-files -m', {cwd});

  if (!dry && modifiedFiles.includes('CHANGELOG.md')) {
    await exec('git add CHANGELOG.md', {cwd});
    await exec(
      `git commit -am "Updating CHANGELOG.md for ${version} release"`,
      {
        cwd,
      }
    );
  }
};

module.exports = async params => {
  return logPromise(update(params), 'Committing CHANGELOG updates');
};
