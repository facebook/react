#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const prompt = require('prompt-promise');
const semver = require('semver');

const run = async (params, versionsMap) => {
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
    const packageNames = chalk.green(packages.join(', '));
    const defaultVersion = bestGuessVersion
      ? chalk.yellow(` (default ${bestGuessVersion})`)
      : '';
    const version =
      (await prompt(
        chalk`{green ✓} Version for ${packageNames}${defaultVersion}: `
      )) || bestGuessVersion;
    prompt.done();

    // Verify a valid version has been supplied.
    try {
      semver(version);

      packages.forEach(packageName => {
        versionsMap.set(packageName, version);
      });
    } catch (error) {
      console.log(chalk`{red ✘ Version {white ${version}} is invalid.}`);

      // Prompt again
      i--;
    }
  }
};

// Run this directly because it's fast,
// and logPromise would interfere with console prompting.
module.exports = run;
