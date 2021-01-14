#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');

const paramDefinitions = [
  {
    name: 'build',
    type: Number,
    description:
      'Circle CI build identifier (e.g. https://circleci.com/gh/facebook/react/<build>)',
  },
  {
    name: 'skipTests',
    type: Boolean,
    description: 'Skip automated fixture tests.',
    defaultValue: false,
  },
  {
    name: 'releaseChannel',
    alias: 'r',
    type: String,
    description: 'Release channel (stable or experimental)',
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  const channel = params.releaseChannel;
  if (channel !== 'experimental' && channel !== 'stable') {
    console.error(
      `Invalid release channel (-r) "${channel}". Must be "stable" or "experimental".`
    );
    process.exit(1);
  }

  return params;
};
