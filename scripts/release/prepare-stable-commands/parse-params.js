#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const paramDefinitions = [
  {
    name: 'local',
    type: Boolean,
    description:
      'Skip NPM and use the build already present in "build/node_modules".',
    defaultValue: false,
  },
  {
    name: 'skipTests',
    type: Boolean,
    description: 'Skip automated fixture tests.',
    defaultValue: false,
  },
  {
    name: 'version',
    type: String,
    description: 'Version of published canary release (e.g. 0.0.0-ddaf2b07c)',
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  if (!params.version) {
    const usage = commandLineUsage([
      {
        content: 'Prepare a published canary release to be promoted to stable.',
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
            example:
              '$ ./prepare-stable.js [bold]{--version=}[underline]{0.0.0-ddaf2b07c}',
          },
        ],
      },
    ]);
    console.log(usage);
    process.exit(1);
  }

  return params;
};
