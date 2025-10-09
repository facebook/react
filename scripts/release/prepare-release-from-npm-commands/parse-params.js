#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const {splitCommaParams} = require('../utils');

const paramDefinitions = [
  {
    name: 'onlyPackages',
    type: String,
    multiple: true,
    description: 'Packages to include in publishing',
    defaultValue: [],
  },
  {
    name: 'skipPackages',
    type: String,
    multiple: true,
    description: 'Packages to exclude from publishing',
    defaultValue: [],
  },
  {
    name: 'skipTests',
    type: Boolean,
    description: 'Skip automated fixture tests.',
    defaultValue: false,
  },
  {
    name: 'prerelease',
    type: String,
    description:
      'prerelease to publish (e.g. version 19.2.0-canary-86181134-20251001 has prerelease "86181134-20251001")',
  },
  {
    name: 'ci',
    type: Boolean,
    description: 'Run in automated environment, without interactive prompts.',
    defaultValue: false,
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  splitCommaParams(params.skipPackages);
  splitCommaParams(params.onlyPackages);

  return params;
};
