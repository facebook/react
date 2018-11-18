#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {confirm} = require('../utils');
const theme = require('../theme');

const run = async () => {
  clear();

  console.log(
    theme.caution(
      'This script does not run any automated tests.' +
        'You should run them manually before creating a canary release.'
    )
  );

  await confirm('Do you want to proceed?');

  clear();
};

module.exports = run;
