#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const paramDefinitions = [
  {
    name: 'build',
    type: Number,
    description:
      'Circle CI build identifier (e.g. https://circleci.com/gh/facebook/react/<build>)',
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  if (!params.build) {
    const usage = commandLineUsage([
      {
        content:
          'Prepare a Circle CI build to be published to NPM as a canary.',
      },
      {
        header: 'Options',
        optionList: paramDefinitions,
      },
      {
        header: 'Examples',
        content: [
          {
            desc: 'Example:',
            example: '$ ./prepare-canary.js [bold]{--build=}[underline]{12639}',
          },
        ],
      },
    ]);
    console.log(usage);
    process.exit(1);
  }

  return params;
};
