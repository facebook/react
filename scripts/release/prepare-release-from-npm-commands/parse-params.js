#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const {splitCommaParams} = require('../utils');

const paramDefinitions = [
  {
    name: 'local',
    type: Boolean,
    description:
      'Skip NPM and use the build already present in "build/node_modules".',
    defaultValue: false,
  },
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
    name: 'version',
    type: String,
    description:
      'Version of published "next" release (e.g. 0.0.0-0e526bcec-20210202)',
  },
  {
    name: 'publishVersion',
    type: String,
    description: 'Version to publish',
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
