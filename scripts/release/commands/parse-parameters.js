#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const logo = require('../logo');

module.exports = () => {
  const paramDefinitions = [
    {
      name: 'dry',
      type: Boolean,
      defaultValue: false,
      description: 'Build artifacts but do not commit or publish',
    },
    {
      name: 'path',
      type: String,
      alias: 'p',
      description: 'Location of React repository to release; defaults to [bold]{cwd}',
    },
    {
      name: 'version',
      type: String,
      alias: 'v',
      description: 'Semantic version number',
    },
  ];

  const params = commandLineArgs(paramDefinitions);

  if (!params.version) {
    const usage = commandLineUsage([
      {
        content: logo,
        raw: true,
      },
      {
        header: 'React Release Manager',
        content: 'Automated release script.',
      },
      {
        header: 'Options',
        optionList: paramDefinitions,
      },
      {
        header: 'Examples',
        content: [
          {
            desc: '1. A concise example.',
            example: '$ ./release [bold]{-v} [underline]{16.0.0}',
          },
          {
            desc: '2. Dry run publishing a release candidate.',
            example: '$ ./release [bold]{--dry} [bold]{-v} [underline]{16.0.0-rc.0}',
          },
          {
            desc: '3. Release from another checkout.',
            example: '$ ./release [bold]{--version}=[underline]{16.0.0} [bold]{--path}=/path/to/react/repo',
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
