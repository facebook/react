#!/usr/bin/env node

'use strict';

const {execUnlessDry, logPromise} = require('../utils');

const push = async ({cwd, dry}) => {
  await execUnlessDry('git push', {cwd, dry});
  await execUnlessDry('git push --tags', {cwd, dry});
};

module.exports = async params => {
  return logPromise(push(params), 'Pushing to git remote');
};
