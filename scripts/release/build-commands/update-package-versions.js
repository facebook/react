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

      // Unstable packages (eg version < 1.0) are treated specially:
      // Rather than use the release version (eg 16.1.0)-
      // We just auto-increment the minor version (eg 0.1.0 -> 0.2.0).
      // If we're doing a prerelease, we also append the suffix (eg 0.2.0-beta).
      if (semver.lt(json.version, '1.0.0')) {
        const prerelease = semver.prerelease(version);
        let suffix = '';
        if (prerelease) {
          suffix = `-${prerelease.join('.')}`;
        }

        json.version = `0.${semver.minor(json.version) + 1}.0${suffix}`;
      } else {
        json.version = version;
      }

      if (project !== 'react') {
        const peerVersion = json.peerDependencies.react.replace('^', '');

        // Release engineers can manually update minor and bugfix versions,
        // But we should ensure that major versions always match.
        if (semver.major(version) !== semver.major(peerVersion)) {
          json.peerDependencies.react = `^${semver.major(version)}.0.0`;
        }
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
