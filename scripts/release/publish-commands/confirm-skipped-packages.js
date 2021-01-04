#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {confirm} = require('../utils');
const theme = require('../theme');

const run = async ({cwd, packages, skipPackages, tags}) => {
  if (skipPackages.length === 0) {
    return;
  }

  clear();

  console.log(
    theme`{spinnerSuccess ✓} The following packages will not be published as part of this release`
  );

  skipPackages.forEach(packageName => {
    console.log(theme`• {package ${packageName}}`);
  });

  await confirm('Do you want to proceed?');

  clear();
};

// Run this directly because it's fast,
// and logPromise would interfere with console prompting.
module.exports = run;
