#!/usr/bin/env node

'use strict';

const chalk = require('chalk');

module.exports = () => {
  if (!process.env.CIRCLE_CI_API_TOKEN) {
    throw Error(
      chalk`
      {red Missing CircleCI API token}

      {white The CircleCI API is used to check the status of the latest commit.}
      {white This API requires a token which must be exposed via a {yellow.bold CIRCLE_CI_API_TOKEN} environment var.}
      {white In order to run this script you will need to create your own API token.}
      {white Instructions can be found at:}

      {blue.bold https://circleci.com/docs/api/v1-reference/#getting-started}

      {white To make this token available to the release script, add it to your {yellow.bold .bash_profile} like so:}

      {gray # React release script}
      {white export CIRCLE_CI_API_TOKEN=<your-token-here>}
    `
    );
  }
};
