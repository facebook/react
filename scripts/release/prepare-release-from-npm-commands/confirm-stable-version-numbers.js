#!/usr/bin/env node

'use strict';

const prompt = require('prompt-promise');
const semver = require('semver');
const theme = require('../theme');
const {confirm} = require('../utils');

const run = async ({skipPackages}, versionsMap) => {
  const groupedVersionsMap = new Map();

  // Group packages with the same source versions.
  // We want these to stay lock-synced anyway.
  // This will require less redundant input from the user later,
  // and reduce the likelihood of human error (entering the wrong version).
  versionsMap.forEach((version, packageName) => {
    if (!groupedVersionsMap.has(version)) {
      groupedVersionsMap.set(version, [packageName]);
    } else {
      groupedVersionsMap.get(version).push(packageName);
    }
  });

  // Prompt user to confirm or override each version group.
  const entries = [...groupedVersionsMap.entries()];
  for (let i = 0; i < entries.length; i++) {
    const [bestGuessVersion, packages] = entries[i];
    const packageNames = packages.map(name => theme.package(name)).join(', ');

    let version = bestGuessVersion;
    if (
      skipPackages.some(skipPackageName =>
        packageNames.includes(skipPackageName)
      )
    ) {
      await confirm(
        theme`{spinnerSuccess ✓} Version for ${packageNames} will remain {version ${bestGuessVersion}}`
      );
    } else {
      const defaultVersion = bestGuessVersion
        ? theme.version(` (default ${bestGuessVersion})`)
        : '';
      version =
        (await prompt(
          theme`{spinnerSuccess ✓} Version for ${packageNames}${defaultVersion}: `
        )) || bestGuessVersion;
      prompt.done();
    }

    // Verify a valid version has been supplied.
    try {
      semver(version);

      packages.forEach(packageName => {
        versionsMap.set(packageName, version);
      });
    } catch (error) {
      console.log(
        theme`{spinnerError ✘} Version {version ${version}} is invalid.`
      );

      // Prompt again
      i--;
    }
  }
};

// Run this directly because it's fast,
// and logPromise would interfere with console prompting.
module.exports = run;
