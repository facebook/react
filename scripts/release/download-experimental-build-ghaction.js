#!/usr/bin/env node

'use strict';

const {join, relative} = require('path');
const {getPublicPackages, handleError} = require('./utils');
const yargs = require('yargs');
const clear = require('clear');
const theme = require('./theme');

const argv = yargs.wrap(yargs.terminalWidth()).options({
  releaseChannel: {
    alias: 'r',
    describe: 'Download the given release channel.',
    requiresArg: true,
    type: 'string',
    choices: ['experimental', 'stable'],
    default: 'experimental',
  },
  commit: {
    alias: 'c',
    describe: 'Commit hash to download.',
    requiresArg: true,
    type: 'string',
  },
  skipTests: {
    requiresArg: false,
    type: 'boolean',
    default: false,
  },
  allowBrokenCI: {
    requiresArg: false,
    type: 'boolean',
    default: false,
  },
}).argv;

// Inlined from scripts/release/download-experimental-build-commands/print-summary.js
function printSummary(commit) {
  const commandPath = relative(
    process.env.PWD,
    join(__dirname, '../download-experimental-build-ghaction.js')
  );

  clear();

  const message = theme`
    {caution An experimental build has been downloaded!}

    You can download this build again by running:
    {path   ${commandPath}} --commit={commit ${commit}}
  `;

  console.log(message.replace(/\n +/g, '\n').trim());
}

const run = async () => {
  try {
    argv.cwd = join(__dirname, '..', '..');
    argv.packages = await getPublicPackages(true);

    console.log(argv);

    printSummary(argv.commit);
  } catch (error) {
    handleError(error);
  }
};

run();
