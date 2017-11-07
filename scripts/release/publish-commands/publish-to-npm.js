#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {readJson} = require('fs-extra');
const {join} = require('path');
const semver = require('semver');
const {execRead, execUnlessDry, logPromise} = require('../utils');
const {projects} = require('../config');

const push = async ({cwd, dry, version}) => {
  const errors = [];
  const isPrerelease = semver.prerelease(version);
  const tag = isPrerelease ? 'next' : 'latest';

  const publishProject = async project => {
    try {
      const path = join(cwd, 'build', 'packages', project);
      await execUnlessDry(`npm publish --tag ${tag}`, {cwd: path, dry});

      const packagePath = join(
        cwd,
        'build',
        'packages',
        project,
        'package.json'
      );
      const packageJSON = await readJson(packagePath);
      const packageVersion = packageJSON.version;

      if (!dry) {
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
        // Update the @next tag to also point to it (so @next doens't lag behind).
        if (!isPrerelease) {
          await execUnlessDry(
            `npm dist-tag add ${project}@${packageVersion} next`
          );
        }
      }
    } catch (error) {
      errors.push(error.message);
    }
  };

  await Promise.all(projects.map(publishProject));

  if (errors.length > 0) {
    throw Error(
      chalk`
      Failure publishing to NPM

      {white ${errors.join('\n')}}`
    );
  }
};

module.exports = async params => {
  return logPromise(push(params), 'Publishing packages to NPM');
};
