#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const logUpdate = require('log-update');

const checkBuildStatus = require('./publish/check-build-status');
const commitChangelog = require('./publish/commit-changelog');
const parsePublishParams = require('./publish/parse-publish-params');
const printPostPublishSummary = require('./publish/print-post-publish-summary');
const pushGitRemote = require('./publish/push-git-remote');
const publishToNpm = require('./publish/publish-to-npm');

// Follows the steps outlined in github.com/facebook/react/issues/10620
const run = async () => {
  const params = parsePublishParams();

  try {
    await checkBuildStatus(params);
    await commitChangelog(params);
    await pushGitRemote(params);
    await publishToNpm(params);
    await printPostPublishSummary(params);
  } catch (error) {
    logUpdate.clear();

    const message = error.message.trim().replace(/\n +/g, '\n');
    const stack = error.stack.replace(error.message, '');

    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red(message)}\n\n${chalk.gray(stack)}`
    );

    process.exit(1);
  }
};

run();
