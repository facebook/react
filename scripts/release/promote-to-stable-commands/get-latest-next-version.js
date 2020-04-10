#!/usr/bin/env node

'use strict';

const {execRead, logPromise} = require('../utils');

const run = async () => {
  const version = await execRead('npm info react@next version');

  return version;
};

module.exports = async params => {
  return logPromise(run(params), 'Determining latest "next" release version');
};
