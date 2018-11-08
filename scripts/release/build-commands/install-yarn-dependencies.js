#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {logPromise} = require('../utils');

const install = async ({cwd}) => {
  await exec('rm -rf node_modules', {cwd});
  await exec('yarn', {cwd});
};

module.exports = async ({cwd}) => {
  return logPromise(install({cwd}), 'Installing NPM dependencies');
};
