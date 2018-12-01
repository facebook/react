#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {getPublicPackages, handleError} = require('./utils');

const checkEnvironmentVariables = require('./prepare-canary-commands/check-environment-variables');
const downloadBuildArtifacts = require('./prepare-canary-commands/download-build-artifacts');
const getLatestMasterBuildNumber = require('./prepare-canary-commands/get-latest-master-build-number');
const parseParams = require('./prepare-canary-commands/parse-params');
const printPrereleaseSummary = require('./shared-commands/print-prerelease-summary');

const run = async () => {
  try {
    const params = parseParams();
    params.cwd = join(__dirname, '..', '..');
    params.packages = await getPublicPackages();

    if (!params.build) {
      params.build = await getLatestMasterBuildNumber();
    }

    await checkEnvironmentVariables(params);
    await downloadBuildArtifacts(params);
    await printPrereleaseSummary(params);
  } catch (error) {
    handleError(error);
  }
};

run();
