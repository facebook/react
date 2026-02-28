#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {existsSync} = require('fs');
const {join} = require('path');
const {execRead} = require('../utils');
const theme = require('../theme');

const run = async (packages, versionsMap, {cwd, prerelease}) => {
  if (!existsSync(join(cwd, 'build'))) {
    await exec(`mkdir ./build`, {cwd});
  }

  // Cleanup from previous builds
  await exec(`rm -rf ./build/node_modules*`, {cwd});
  await exec(`mkdir ./build/node_modules`, {cwd});

  const nodeModulesPath = join(cwd, 'build/node_modules');

  // Checkout "next" release from NPM for all local packages
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    if (!(packageName in versionsMap)) {
      throw Error(
        `Package "${packageName}" has no version specified. Only ${JSON.stringify(
          Object.keys(versionsMap)
        )} are supported are valid package names.`
      );
    }
    const version = versionsMap[packageName] + '-canary-' + prerelease;

    // We previously used `npm install` for this,
    // but in addition to checking out a lot of transient dependencies that we don't care about–
    // the NPM client also added a lot of registry metadata to the package JSONs,
    // which we had to remove as a separate step before re-publishing.
    // It's easier for us to just download and extract the tarball.
    const url = await execRead(
      `npm view ${packageName}@${version} dist.tarball`
    );
    const filePath = join(nodeModulesPath, `${packageName}.tgz`);
    const packagePath = join(nodeModulesPath, `${packageName}`);
    const tempPackagePath = join(nodeModulesPath, 'package');

    // Download packages from NPM and extract them to the expected build locations.
    await exec(`curl -L ${url} > ${filePath}`, {cwd});
    await exec(`tar -xvzf ${filePath} -C ${nodeModulesPath}`, {cwd});
    await exec(`mv ${tempPackagePath} ${packagePath}`, {cwd});
    await exec(`rm ${filePath}`, {cwd});

    console.log(
      theme`{green ✔} NPM checkout {package ${packageName}}@{version ${version}}`
    );
  }
};

// Run this directly because logPromise would interfere with printing package dependencies.
module.exports = run;
