#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const figlet = require('figlet');

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
        content: chalk
          .hex('#61dafb')
          .bold(figlet.textSync('react', {font: 'Graffiti'})),
        raw: true,
      },
      {
        content: 'Automated pre-release build script.',
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
            example: '$ ./build.js [bold]{-v} [underline]{16.0.0}',
          },
          {
            desc: '2. Dry run build a release candidate (no git commits).',
            example: '$ ./build.js [bold]{--dry} [bold]{-v} [underline]{16.0.0-rc.0}',
          },
          {
            desc: '3. Release from another checkout.',
            example: '$ ./build.js [bold]{--version}=[underline]{16.0.0} [bold]{--path}=/path/to/react/repo',
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
