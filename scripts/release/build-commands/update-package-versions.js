#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {readFileSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const {join} = require('path');
const semver = require('semver');
const {projects} = require('../config');
const {execUnlessDry, logPromise} = require('../utils');

const update = async ({cwd, dry, version}) => {
  try {
    // Update root package.json
    const packagePath = join(cwd, 'package.json');
    const rootPackage = await readJson(packagePath);
    rootPackage.version = version;
    await writeJson(packagePath, rootPackage, {spaces: 2});

    // Update ReactVersion source file
    const reactVersionPath = join(cwd, 'packages/shared/ReactVersion.js');
    const reactVersion = readFileSync(reactVersionPath, 'utf8').replace(
      /module\.exports = '[^']+';/,
      `module.exports = '${version}';`
    );
    writeFileSync(reactVersionPath, reactVersion);

    // Update renderer versions and peer dependencies
    const updateProjectPackage = async project => {
      const path = join(cwd, 'packages', project, 'package.json');
      const json = await readJson(path);

      // Unstable packages (eg version < 1.0) are treated differently.
      // In order to simplify DX for the release engineer,
      // These packages are auto-incremented by a minor version number.
      if (semver.lt(json.version, '1.0.0')) {
        json.version = `0.${semver.minor(json.version) + 1}.0`;
      } else {
        json.version = version;
      }

      if (project !== 'react') {
        json.peerDependencies.react = `^${version}`;
      }
      await writeJson(path, json, {spaces: 2});
    };
    await Promise.all(projects.map(updateProjectPackage));

    // Version sanity check
    await exec('yarn version-check', {cwd});

    await execUnlessDry(
      `git commit -am "Updating package versions for release ${version}"`,
      {cwd, dry}
    );
  } catch (error) {
    throw Error(
      chalk`
      Failed while updating package versions

      {white ${error.message}}
    `
    );
  }
};

module.exports = async params => {
  return logPromise(update(params), 'Updating package versions');
};
