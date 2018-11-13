#!/usr/bin/env node

'use strict';

const {getPublicPackages, handleError} = require('./utils');

const checkBuildStatus = require('./publish-commands/check-build-status');
const commitChangelog = require('./publish-commands/commit-changelog');
const getNpmTwoFactorAuth = require('./publish-commands/get-npm-two-factor-auth');
const parsePublishParams = require('./publish-commands/parse-publish-params');
const printPostPublishSummary = require('./publish-commands/print-post-publish-summary');
const pushGitRemote = require('./publish-commands/push-git-remote');
const publishToNpm = require('./publish-commands/publish-to-npm');

// Follows the steps outlined in github.com/facebook/react/issues/10620
const run = async () => {
  const params = parsePublishParams();
  params.packages = getPublicPackages();

  try {
    await checkBuildStatus(params);
    await commitChangelog(params);
    await pushGitRemote(params);
    params.otp = await getNpmTwoFactorAuth(params);
    await publishToNpm(params);
    await printPostPublishSummary(params);
  } catch (error) {
    handleError(error);
  }
};

run();
