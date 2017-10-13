#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const http = require('request-promise-json');
const {execRead, logPromise} = require('../utils');

// https://circleci.com/docs/api/v1-reference/#projects
const CIRCLE_CI_BASE_URL =
  'https://circleci.com/api/v1.1/project/github/facebook/react/tree/master';

const check = async ({cwd}) => {
  const token = process.env.CIRCLE_CI_API_TOKEN;
  const uri = `${CIRCLE_CI_BASE_URL}?circle-token=${token}&limit=1`;

  const response = await http.get(uri, true);
  const {outcome, status, vcs_revision: ciRevision} = response[0];

  const gitRevision = await execRead('git rev-parse HEAD', {cwd});

  if (gitRevision !== ciRevision) {
    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red('CircleCI is stale')}\n\n` +
        `The latest Git revision is ${chalk.yellow(gitRevision)}.\n` +
        `The most recent CircleCI revision is ${chalk.yellow(ciRevision)}.\n` +
        'Please wait for CircleCI to catch up.'
    );
    process.exit(1);
  } else if (outcome !== 'success') {
    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red('CircleCI failed')}\n\n` +
        `The most recent CircleCI build has a status of ${chalk.red(outcome || status)}.\n` +
        'Please retry this build in CircleCI if you believe this is an error.'
    );
    process.exit(1);
  }
};

module.exports = async params => {
  return logPromise(check(params), 'Checking CircleCI status');
};
