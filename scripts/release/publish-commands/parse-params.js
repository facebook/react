#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const paramDefinitions = [
  {
    name: 'dry',
    type: Boolean,
    description: 'Dry run command without actually publishing to NPM.',
    defaultValue: false,
  },
  {
    name: 'tags',
    type: String,
    multiple: true,
    description: 'NPM tags to point to the new release.',
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  if (!params.tags || params.tags.length === 0) {
    const usage = commandLineUsage([
      {
        content:
          'Publishes the current contents of "build/node_modules" to NPM.',
      },
      {
        header: 'Options',
        optionList: paramDefinitions,
      },
      {
        header: 'Examples',
        content: [
          {
            desc: 'Dry run test:',
            example: '$ scripts/release/publish.js --dry --tags next',
          },
          {
            desc: 'Publish a new stable:',
            example: '$ scripts/release/publish.js --tags next latest',
          },
        ],
      },
    ]);
    console.log(usage);
    process.exit(1);
  }

  return params;
};
