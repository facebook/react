#!/usr/bin/env node

'use strict';

const semver = require('semver');
const {execRead, logPromise} = require('../utils');

const run = async (
  {cwd, packages, skipPackages, ci, publishVersion},
  versionsMap
) => {
  const branch = await execRead('git branch | grep \\* | cut -d " " -f2', {
    cwd,
  });

  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];

    if (ci === true) {
      if (publishVersion != null) {
        versionsMap.set(packageName, publishVersion);
      } else {
        console.error(
          'When running in CI mode, a publishVersion must be supplied'
        );
        process.exit(1);
      }
    } else {
      try {
        // In case local package JSONs are outdated,
        // guess the next version based on the latest NPM release.
        const version = await execRead(`npm show ${packageName} version`);

        if (skipPackages.includes(packageName)) {
          versionsMap.set(packageName, version);
        } else {
          const {major, minor, patch} = semver(version);

          // Guess the next version by incrementing patch.
          // The script will confirm this later.
          // By default, new releases from mains should increment the minor version number,
          // and patch releases should be done from branches.
          if (branch === 'main') {
            versionsMap.set(packageName, `${major}.${minor + 1}.0`);
          } else {
            versionsMap.set(packageName, `${major}.${minor}.${patch + 1}`);
          }
        }
      } catch (error) {
        // If the package has not yet been published,
        // we'll require a version number to be entered later.
        versionsMap.set(packageName, null);
      }
    }
  }
};

module.exports = async (params, versionsMap) => {
  return logPromise(
    run(params, versionsMap),
    'Guessing stable version numbers'
  );
};
