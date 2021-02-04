#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const getBuildIdForCommit = require('../get-build-id-for-commit');
const theme = require('../theme');

const paramDefinitions = [
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

  const channel = params.releaseChannel;
  if (channel !== 'experimental' && channel !== 'stable') {
    console.error(
      theme.error`Invalid release channel (-r) "${channel}". Must be "stable" or "experimental".`
    );
    process.exit(1);
  }

  if (params.commit === null) {
    console.error(theme.error`No --commit param specified.`);
    process.exit(1);
  }

  try {
    params.build = await getBuildIdForCommit(params.commit);
  } catch (error) {
    console.error(theme.error(error));
    process.exit(1);
  }

  return params;
};
