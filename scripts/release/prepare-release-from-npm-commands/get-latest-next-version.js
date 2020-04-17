#!/usr/bin/env node

'use strict';

const {execRead, logPromise} = require('../utils');

const run = async () => {
  return await execRead('npm info react@next version');
};

module.exports = async params => {
  return logPromise(run(params), 'Determining latest "next" release version');
};
