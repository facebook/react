#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {
  addDefaultParamValue,
  getPublicPackages,
  handleError,
} = require('./utils');

const checkEnvironmentVariables = require('./shared-commands/check-environment-variables');
const downloadBuildArtifacts = require('./shared-commands/download-build-artifacts');
const getLatestMasterBuildNumber = require('./shared-commands/get-latest-master-build-number');
const parseParams = require('./shared-commands/parse-params');
const printSummary = require('./download-experimental-build-commands/print-summary');

const run = async () => {
  try {
    addDefaultParamValue('-r', '--releaseChannel', 'experimental');
    addDefaultParamValue(
      null,
      '--build',
      await getLatestMasterBuildNumber(true)
    );

    const params = await parseParams();
    params.cwd = join(__dirname, '..', '..');
    params.packages = await getPublicPackages(true);

    await checkEnvironmentVariables(params);
    await downloadBuildArtifacts(params);

    printSummary(params);
  } catch (error) {
    handleError(error);
  }
};

run();
