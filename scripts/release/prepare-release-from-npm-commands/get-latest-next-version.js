#!/usr/bin/env node

'use strict';

const {execRead, logPromise} = require('../utils');

const run = async () => {
  const version = await execRead('npm info react@canary version');

  return version;
};

module.exports = async params => {
  return logPromise(run(params), 'Determining latest "canary" release version');
};
