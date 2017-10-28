#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {join} = require('path');
const semver = require('semver');
const {execRead, execUnlessDry, logPromise} = require('../utils');
const {projects} = require('../config');

const push = async ({cwd, dry, version}) => {
  const errors = [];
  const tag = semver.prerelease(version) ? 'next' : 'latest';

  const publishProject = async project => {
    try {
      const path = join(cwd, 'build', 'packages', project);
      await execUnlessDry(`npm publish --tag ${tag}`, {cwd: path, dry});

      if (!dry) {
        const status = JSON.parse(
          await execRead(`npm info ${project} dist-tags --json`)
        );
        const remoteVersion = status[tag];

        if (remoteVersion !== version) {
          throw Error(
            chalk`Publised version {yellow.bold ${version}} for ` +
              `{bold ${project}} but NPM shows {yellow.bold ${remoteVersion}}`
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
  return logPromise(push(params), 'Pushing to git remote');
};
