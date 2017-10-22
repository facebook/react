#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const figlet = require('figlet');
const {paramDefinitions} = require('../config');

module.exports = () => {
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
        content: 'Automated release publishing script.',
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
            example: '$ ./publish.js [bold]{-v} [underline]{16.0.0}',
          },
          {
            desc: '2. Dry run publish a release candidate.',
            example: '$ ./publish.js [bold]{--dry} [bold]{-v} [underline]{16.0.0-rc.0}',
          },
          {
            desc: '3. Release from another checkout.',
            example: '$ ./publish.js [bold]{--version}=[underline]{16.0.0} [bold]{--path}=/path/to/react/repo',
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
