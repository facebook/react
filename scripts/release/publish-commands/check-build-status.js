#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {existsSync} = require('fs');
const {readJson} = require('fs-extra');
const {join} = require('path');

module.exports = async ({cwd, version, local}) => {
  if (local) {
    return;
  }
  const packagePath = join(
    cwd,
    'build',
    'node_modules',
    'react',
    'package.json'
  );

  if (!existsSync(packagePath)) {
    throw Error('No build found');
  }

  const packageJson = await readJson(packagePath);

  if (packageJson.version !== version) {
    throw Error(
      chalk`Expected version {bold.white ${version}} but found {bold.white ${
        packageJson.version
      }}`
    );
  }
};
