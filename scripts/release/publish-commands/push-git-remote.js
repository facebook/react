#!/usr/bin/env node

'use strict';

const {execUnlessDry, logPromise} = require('../utils');

const push = async ({cwd, dry}) => {
  await execUnlessDry('git push', {cwd, dry});
  await execUnlessDry('git push --tags', {cwd, dry});
};

module.exports = async params => {
  if (params.local) {
    return;
  }
  return logPromise(push(params), 'Pushing to git remote');
};
