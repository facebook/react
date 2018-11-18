#!/usr/bin/env node

'use strict';

const clear = require('clear');
const {readJson} = require('fs-extra');
const {join} = require('path');
const {confirm} = require('../utils');
const theme = require('../theme');

const run = async ({cwd, packages, tags}) => {
  clear();

  if (tags.length === 1) {
    console.log(
      theme`{spinnerSuccess ✓} You are about the publish the following packages under the tag {tag ${tags}}`
    );
  } else {
    console.log(
      theme`{spinnerSuccess ✓} You are about the publish the following packages under the tags {tag ${tags.join(
        ', '
      )}}`
    );
  }

  // Cache all package JSONs for easy lookup below.
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packageJSONPath = join(
      cwd,
      'build/node_modules',
      packageName,
      'package.json'
    );
    const packageJSON = await readJson(packageJSONPath);
    console.log(
      theme`• {package ${packageName}} {version ${packageJSON.version}}`
    );
  }

  await confirm('Do you want to proceed?');
};

// Run this directly because it's fast,
// and logPromise would interfere with console prompting.
module.exports = run;
