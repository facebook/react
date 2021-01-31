#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const getBuildIdForCommit = require('../get-build-id-for-commit');

const paramDefinitions = [
  {
    name: 'build',
    type: Number,
    description:
      'Circle CI build identifier (e.g. https://circleci.com/gh/facebook/react/<build>)',
    defaultValue: null,
  },
  {
    name: 'commit',
    type: String,
    description:
      'GitHub commit SHA. When provided, automatically finds corresponding CI build.',
    defaultValue: null,
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

module.exports = async () => {
  const params = commandLineArgs(paramDefinitions);

  if (params.build !== null) {
    if (params.commit !== null) {
      console.error(
        '`build` and `commmit` params are mutually exclusive. Choose one or the other.`'
      );
      process.exit(1);
    }
  } else {
    if (params.commit === null) {
      console.error('Must provide either `build` or `commit`.');
      process.exit(1);
    }
    try {
      params.build = await getBuildIdForCommit(params.commit);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }

  const channel = params.releaseChannel;
  if (channel !== 'experimental' && channel !== 'stable') {
    console.error(
      `Invalid release channel (-r) "${channel}". Must be "stable" or "experimental".`
    );
    process.exit(1);
  }

  return params;
};
