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
    defaultValue: ['untagged'],
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
  splitCommaParams(params.tags);
  params.tags.forEach(tag => {
    switch (tag) {
      case 'latest':
      case 'canary':
      case 'next':
      case 'experimental':
      case 'alpha':
      case 'beta':
      case 'rc':
      case 'untagged':
        break;
      default:
        console.error('Unsupported tag: "' + tag + '"');
        process.exit(1);
        break;
    }
  });
  return params;
};
