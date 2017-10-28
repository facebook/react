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
    throw Error(
      chalk`
      CircleCI is stale

      {white The latest Git revision is {yellow.bold ${gitRevision}}}
      {white The most recent CircleCI revision is {yellow.bold ${ciRevision}}}
      {white Please wait for CircleCI to catch up.}
    `
    );
  } else if (outcome !== 'success') {
    throw Error(
      chalk`
      CircleCI failed
      
      {white The most recent CircleCI build has a status of {red.bold ${outcome || status}}}
      {white Please retry this build in CircleCI if you believe this is an error.}
    `
    );
  }
};

module.exports = async params => {
  return logPromise(check(params), 'Checking CircleCI status');
};
