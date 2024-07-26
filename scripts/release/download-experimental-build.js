#!/usr/bin/env node

'use strict';

const {join, relative} = require('path');
const {handleError} = require('./utils');
const yargs = require('yargs');
const clear = require('clear');
const theme = require('./theme');
const {
  downloadBuildArtifacts,
} = require('./shared-commands/download-build-artifacts');

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
    demandOption: true,
    type: 'string',
  },
}).argv;

function printSummary(commit) {
  const commandPath = relative(
    process.env.PWD,
    join(__dirname, '../download-experimental-build.js')
  );

  clear();

  const message = theme`
    {caution An experimental build has been downloaded!}

    You can download this build again by running:
    {path   ${commandPath}} --commit={commit ${commit}}
  `;

  console.log(message.replace(/\n +/g, '\n').trim());
}

const main = async () => {
  try {
    await downloadBuildArtifacts(argv.commit, argv.releaseChannel);
    printSummary(argv.commit);
  } catch (error) {
    handleError(error);
  }
};

main();
