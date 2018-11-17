#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {readJson} = require('fs-extra');
const {join} = require('path');

const run = async ({cwd, packages, tags}) => {
  // Prevent a canary release from ever being published as @latest
  const packageJSONPath = join(
    cwd,
    'build',
    'node_modules',
    'react',
    'package.json'
  );
  const {version} = await readJson(packageJSONPath);
  if (version.indexOf('0.0.0') === 0) {
    if (tags.includes('latest')) {
      console.log(
        chalk`{red.bold Canary release {white (${version})} cannot be tagged as {yellow latest}.}`
      );
      process.exit(1);
    }
  }
};

module.exports = run;
