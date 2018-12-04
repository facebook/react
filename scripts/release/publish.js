#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {getPublicPackages, handleError} = require('./utils');

const checkNPMPermissions = require('./publish-commands/check-npm-permissions');
const confirmVersionAndTags = require('./publish-commands/confirm-version-and-tags');
const downloadErrorCodesFromCI = require('./publish-commands/download-error-codes-from-ci');
const parseParams = require('./publish-commands/parse-params');
const printFollowUpInstructions = require('./publish-commands/print-follow-up-instructions');
const promptForOTP = require('./publish-commands/prompt-for-otp');
const publishToNPM = require('./publish-commands/publish-to-npm');
const updateStableVersionNumbers = require('./publish-commands/update-stable-version-numbers');
const validateTags = require('./publish-commands/validate-tags');

const run = async () => {
  try {
    const params = parseParams();
    params.cwd = join(__dirname, '..', '..');
    params.packages = await getPublicPackages();

    await validateTags(params);
    await confirmVersionAndTags(params);
    await checkNPMPermissions(params);
    const otp = await promptForOTP(params);
    await publishToNPM(params, otp);
    await downloadErrorCodesFromCI(params);
    await updateStableVersionNumbers(params);
    await printFollowUpInstructions(params);
  } catch (error) {
    handleError(error);
  }
};

run();
