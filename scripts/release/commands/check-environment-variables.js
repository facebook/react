#!/usr/bin/env node

'use strict';

const chalk = require('chalk');

module.exports = () => {
  if (!process.env.CIRCLE_CI_API_TOKEN) {
    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red('Missing CircleCI API token')}\n\n` +
        'The CircleCI API is used to check the status of the latest commit.\n' +
        `This API requires a token which must be exposed via ${chalk.yellow('CIRCLE_CI_API_TOKEN')}.\n` +
        'For instructions on creating this token check out the link below:\n\n' +
        chalk.gray(
          'https://circleci.com/docs/api/v1-reference/#getting-started'
        )
    );
    process.exit(1);
  }
};
