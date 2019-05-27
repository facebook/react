#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');

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

  return params;
};
