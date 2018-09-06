#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {readJson} = require('fs-extra');
const {join} = require('path');
const semver = require('semver');
const {execRead, execUnlessDry, logPromise} = require('../utils');

const push = async ({cwd, dry, otp, packages, version, tag}) => {
  const errors = [];
  const isPrerelease = semver.prerelease(version);
  if (tag === undefined) {
    // No tag was provided. Default to `latest` for stable releases and `next`
    // for prereleases
    tag = isPrerelease ? 'next' : 'latest';
  } else if (tag === 'latest' && isPrerelease) {
    throw new Error('The tag `latest` can only be used for stable versions.');
  }

  // Pass two factor auth code if provided:
  // https://docs.npmjs.com/getting-started/using-two-factor-authentication
  const twoFactorAuth = otp != null ? `--otp ${otp}` : '';

  const publishProject = async project => {
    try {
      const path = join(cwd, 'build', 'node_modules', project);
      await execUnlessDry(`npm publish --tag ${tag} ${twoFactorAuth}`, {
        cwd: path,
        dry,
      });

      const packagePath = join(
        cwd,
        'build',
        'node_modules',
        project,
        'package.json'
      );
      const packageJSON = await readJson(packagePath);
      const packageVersion = packageJSON.version;

      if (!dry) {
        // Wait a couple of seconds before querying NPM for status;
        // Anecdotally, querying too soon can result in a false negative.
        await new Promise(resolve => setTimeout(resolve, 5000));

        const status = JSON.parse(
          await execRead(`npm info ${project} dist-tags --json`)
        );
        const remoteVersion = status[tag];

        // Compare remote version to package.json version,
        // To better handle the case of pre-release versions.
        if (remoteVersion !== packageVersion) {
          throw Error(
            chalk`Published version {yellow.bold ${packageVersion}} for ` +
              chalk`{bold ${project}} but NPM shows {yellow.bold ${remoteVersion}}`
          );
        }

        // If we've just published a stable release,
        // Update the @next tag to also point to it (so @next doesn't lag behind).
        if (!isPrerelease) {
          await execUnlessDry(
            `npm dist-tag add ${project}@${packageVersion} next`,
            {cwd: path, dry}
          );
        }
      }
    } catch (error) {
      errors.push(error.stack);
    }
  };

  await Promise.all(packages.map(publishProject));

  if (errors.length > 0) {
    throw Error(
      chalk`
      Failure publishing to NPM

      {white ${errors.join('\n\n')}}`
    );
  }
};

module.exports = async params => {
  return logPromise(push(params), 'Publishing packages to NPM');
};
