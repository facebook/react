#!/usr/bin/env node

'use strict';

const theme = require('../theme');

module.exports = () => {
  if (!process.env.CIRCLE_CI_API_TOKEN) {
    console.error(
      theme`
      {error Missing CircleCI API token}

      The CircleCI API is used to download build artifacts.
      This API requires a token which must be exposed via a {underline CIRCLE_CI_API_TOKEN} environment var.
      In order to run this script you will need to create your own API token.
      Instructions can be found at:

      {link https://circleci.com/docs/api/v1-reference/#getting-started}

      To make this token available to the release script, add it to your {path .bash_profile} like so:

      {dimmed # React release script}
      export CIRCLE_CI_API_TOKEN=<your-token-here>
    `
        .replace(/\n +/g, '\n')
        .trim()
    );
    process.exit(1);
  }
};
