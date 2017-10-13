#!/usr/bin/env node

'use strict';

const chalk = require('chalk');

module.exports = () => {
  if (!process.env.CIRCLE_CI_API_TOKEN) {
    throw Error(
      chalk`
      {red Missing CircleCI API token}

      {white The CircleCI API is used to check the status of the latest commit.}
      {white This API requires a token which must be exposed via {yellow.bold CIRCLE_CI_API_TOKEN}}
      {white For instructions on creating this token check out the link below:}

      {blue.bold https://circleci.com/docs/api/v1-reference/#getting-started}
    `
    );
  }
};
