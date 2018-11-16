#!/usr/bin/env node

'use strict';

const {tmpdir} = require('os');
const {join} = require('path');
const {getBuildInfo, handleError} = require('./utils');

// This local build script exists for special case, manual builds.
// The typical suggesgted release process is to create a canary from a CI artifact.
// This build script is optimized for speed and simplicity.
// It doesn't run all of the tests that the CI environment runs.
// You're expected to run those manually before publishing a release.

const addBuildInfoJSON = require('./create-build-commands/add-build-info-json');
const buildArtifacts = require('./create-build-commands/build-artifacts');
const copyRepoToTempDirectory = require('./create-build-commands/copy-repo-to-temp-directory');
const npmPackAndUnpack = require('./create-build-commands/npm-pack-and-unpack');
const printPrereleaseSummary = require('./shared-commands/print-prerelease-summary');
const updateVersionNumbers = require('./create-build-commands/update-version-numbers');

const run = async () => {
  try {
    const cwd = join(__dirname, '..', '..');
    const {branch, checksum, commit, version} = await getBuildInfo();
    const tempDirectory = join(tmpdir(), `react-${commit}`);
    const params = {branch, checksum, commit, cwd, tempDirectory, version};

    await copyRepoToTempDirectory(params);
    await updateVersionNumbers(params);
    await addBuildInfoJSON(params);
    await buildArtifacts(params);
    await npmPackAndUnpack(params);
    await printPrereleaseSummary(params);
  } catch (error) {
    handleError(error);
  }
};

run();
