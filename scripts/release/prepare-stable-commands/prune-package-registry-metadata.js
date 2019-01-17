#!/usr/bin/env node

'use strict';

const {logPromise} = require('../utils');
const {readJson, writeJson} = require('fs-extra');
const {join} = require('path');

const run = async ({cwd, packages}) => {
  const nodeModulesPath = join(cwd, 'build/node_modules');

  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packageJSONPath = join(nodeModulesPath, packageName, 'package.json');
    const packageJSON = await readJson(packageJSONPath);

    // NPM adds a lot of metadata fields on checkout.
    // It's nice to strip these before re-publishing the package.
    for (let key in packageJSON) {
      if (key.startsWith('_')) {
        delete packageJSON[key];
      }
    }

    await writeJson(packageJSONPath, packageJSON, {spaces: 2});
  }
};

module.exports = async params => {
  return logPromise(run(params), 'Pruning package registry metadata');
};
