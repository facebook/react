#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const figlet = require('figlet');

const paramDefinitions = [
  {
    name: 'build',
    type: Number,
    description:
      'Circle CI build identifier (e.g. https://circleci.com/gh/facebook/react/<build>)',
    defaultValue: false,
  },
  {
    name: 'path',
    type: String,
    alias: 'p',
    description:
      'Location of React repository to release; defaults to [bold]{cwd}',
    defaultValue: '.',
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  if (!params.build) {
    const usage = commandLineUsage([
      {
        content: chalk
          .hex('#61dafb')
          .bold(figlet.textSync('react', {font: 'Graffiti'})),
        raw: true,
      },
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

  return {
    ...params,
    cwd: params.path, // For script convenience
  };
};
