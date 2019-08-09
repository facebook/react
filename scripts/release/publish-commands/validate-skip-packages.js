#!/usr/bin/env node

'use strict';

const {readJson} = require('fs-extra');
const {join} = require('path');
const theme = require('../theme');
const {execRead} = require('../utils');

const readPackageJSON = async (cwd, name) => {
  const packageJSONPath = join(
    cwd,
    'build',
    'node_modules',
    name,
    'package.json'
  );
  return await readJson(packageJSONPath);
};

const run = async ({cwd, packages, skipPackages}) => {
  if (skipPackages.length === 0) {
    return;
  }

  const validateDependencies = async (name, dependencies) => {
    if (!dependencies) {
      return;
    }

    for (let dependency in dependencies) {
      // Do we depend on a package thas has been skipped?
      if (skipPackages.includes(dependency)) {
        const version = dependencies[dependency];
        // Do we depend on a version of the package than has not been published to NPM?
        const info = await execRead(`npm view ${dependency}@${version}`);
        if (!info) {
          console.log(
            theme`{error Package} {package ${name}} {error depends on an unpublished skipped package}`,
            theme`{package ${dependency}}@{version ${version}}`
          );
          process.exit(1);
        }
      }
    }
  };

  // Make sure none of the other packages depend on a skipped package,
  // unless the dependency has already been published to NPM.
  for (let i = 0; i < packages.length; i++) {
    const name = packages[i];
    const {dependencies, peerDependencies} = await readPackageJSON(cwd, name);

    validateDependencies(name, dependencies);
    validateDependencies(name, peerDependencies);
  }
};

module.exports = run;
