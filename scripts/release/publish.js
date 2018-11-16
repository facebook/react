#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {getPublicPackages, handleError} = require('./utils');

const parseParams = require('./publish-commands/parse-params');

const run = async () => {
  try {
    const params = parseParams();
    params.cwd = join(__dirname, '..', '..');
    params.packages = await getPublicPackages();

    console.log(params);

    // TODO Require inputs: a list of NPM tags (e.g. --tags=latest, --tags=latest,next).
    // TODO Print versions of the local, prepared packages and confirm the tag release.
    // TODO Check NPM permissions to ensure that the current user can publish all public packages.
    // TODO Publish each package to NPM with the specified version number and tag.
    //      J.I.T. prompt (or re-prompt) for OTP token if publishing fails.
    // TODO Print command for tagging the Git commit the release was originally created from (using build-info.json).
    // TODO Print command for creating a changelog.
    // TODO Support basic "resume" by checking each package to see if it has already been published
    //      before publishing it (and skipping it if so).
  } catch (error) {
    handleError(error);
  }
};

run();
