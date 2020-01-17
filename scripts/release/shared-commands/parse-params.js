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
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  return params;
};
