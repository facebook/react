#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {readFileSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const {join} = require('path');
const semver = require('semver');
const {execUnlessDry, logPromise} = require('../utils');

const update = async ({cwd, dry, packages, version}) => {
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
      const prerelease = semver.prerelease(version);

      // Unstable packages (eg version < 1.0) are treated specially:
      // Rather than use the release version (eg 16.1.0)-
      // We just auto-increment the minor version (eg 0.1.0 -> 0.2.0).
      // If we're doing a prerelease, we also append the suffix (eg 0.2.0-beta).
      if (semver.lt(json.version, '1.0.0')) {
        let suffix = '';
        if (prerelease) {
          suffix = `-${prerelease.join('.')}`;
        }

        // If this is a new pre-release, increment the minor.
        // Else just increment (or remove) the pre-release suffix.
        // This way our minor version isn't incremented unnecessarily with each prerelease.
        const minor = semver.prerelease(json.version)
          ? semver.minor(json.version)
          : semver.minor(json.version) + 1;

        json.version = `0.${minor}.0${suffix}`;
      } else {
        json.version = version;
      }

      if (project !== 'react' && json.peerDependencies) {
        let peerVersion = json.peerDependencies.react.replace('^', '');

        // If the previous release was a pre-release version,
        // The peer dependency will contain multiple versions, eg "^16.0.0 || 16.3.0-alpha.0"
        // In this case, assume the first one will be the major and extract it.
        if (peerVersion.includes(' || ')) {
          peerVersion = peerVersion.split(' || ')[0];
        }

        // Release engineers can manually update minor and bugfix versions,
        // But we should ensure that major versions always match.
        if (semver.major(version) !== semver.major(peerVersion)) {
          json.peerDependencies.react = `^${semver.major(version)}.0.0`;
        } else {
          json.peerDependencies.react = `^${peerVersion}`;
        }

        // If this is a prerelease, update the react dependency as well.
        // A dependency on a major version won't satisfy a prerelease version.
        // So rather than eg "^16.0.0" we need "^16.0.0 || 16.3.0-alpha.0"
        if (prerelease) {
          json.peerDependencies.react += ` || ${version}`;
        }

        // Update inter-package dependencies as well.
        // e.g. react-test-renderer depends on react-is
        if (json.dependencies) {
          Object.keys(json.dependencies).forEach(dependency => {
            if (packages.indexOf(dependency) >= 0) {
              json.dependencies[dependency] = `^${version}`;
            }
          });
        }
      }

      await writeJson(path, json, {spaces: 2});
    };
    await Promise.all(packages.map(updateProjectPackage));

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
