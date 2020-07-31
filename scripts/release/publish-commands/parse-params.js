#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const {splitCommaParams} = require('../utils');

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
  {
    name: 'skipPackages',
    type: String,
    multiple: true,
    description: 'Packages to exclude from publishing',
    defaultValue: [],
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);
  if (!params.tags || !params.tags.length) {
    params.tags = [];
  }
  splitCommaParams(params.skipPackages);
  splitCommaParams(params.tags);
  return params;
};
