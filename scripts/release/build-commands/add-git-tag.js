#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {execUnlessDry, logPromise} = require('../utils');

const run = async ({cwd, dry, version}) => {
  await execUnlessDry(`git tag -a ${version} -m "Tagging ${version} release"`, {
    cwd,
    dry,
  });
};

module.exports = async ({cwd, dry, version}) => {
  return logPromise(
    run({cwd, dry, version}),
    `Creating git tag ${chalk.yellow.bold(version)}`
  );
};
