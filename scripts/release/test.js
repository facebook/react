#!/usr/bin/env node

'use strict';

const {exec, spawn} = require('child-process-promise');
const {join} = require('path');
const {readFileSync} = require('fs');
const theme = require('./theme');
const {logPromise, printDiff} = require('./utils');

const cwd = join(__dirname, '..', '..');

const CIRCLE_CI_BUILD = 12707;
const COMMIT = 'b3d1a81a9';
const VERSION = '1.2.3';

const run = async () => {
  const defaultOptions = {
    cwd,
    env: process.env,
  };

  try {
    // Start with a known build/revision:
    // https://circleci.com/gh/facebook/react/12707
    let promise = spawn(
      'node',
      ['./scripts/release/prepare-canary.js', `--build=${CIRCLE_CI_BUILD}`],
      defaultOptions
    );
    logPromise(
      promise,
      theme`Checking out canary build {version ${CIRCLE_CI_BUILD}}`
    );
    await promise;

    // Upgrade the above build top a known React version.
    // Note that using the --local flag skips NPM checkout.
    // This isn't totally necessary but is useful if we want to test an unpublished canary.
    promise = spawn(
      'node',
      [
        './scripts/release/prepare-stable.js',
        `--version=0.0.0-${COMMIT}`,
        '--local',
      ],
      defaultOptions
    );
    promise.childProcess.stdin.setEncoding('utf-8');
    promise.childProcess.stdout.setEncoding('utf-8');
    promise.childProcess.stdout.on('data', data => {
      if (data.includes('✓ Version for')) {
        // Update all packages to a stable version
        promise.childProcess.stdin.write(VERSION);
      } else if (data.includes('(y/N)')) {
        // Accept all of the confirmation prompts
        promise.childProcess.stdin.write('y');
      }
    });
    logPromise(promise, theme`Preparing stable release {version ${VERSION}}`);
    await promise;

    const beforeContents = readFileSync(
      join(cwd, 'scripts/release/test.snapshot'),
      'utf-8'
    );
    await exec('cp build/temp.diff scripts/release/test.snapshot', {cwd});
    const afterContents = readFileSync(
      join(cwd, 'scripts/release/test.snapshot'),
      'utf-8'
    );

    if (beforeContents === afterContents) {
      console.log(theme.header`Snapshot test passed.`);
    } else {
      printDiff('scripts/release/test.snapshot', beforeContents, afterContents);
      console.log();
      console.error(theme.error('Snapshot test failed!'));
      console.log();
      console.log(
        'If this failure was expected, please update the contents of the snapshot file:'
      );
      console.log(
        theme`  {command git add} {path scripts/release/test.snapshot}`
      );
      console.log(
        theme`  {command git commit -m "Updating release script snapshot file."}`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(theme.error(error));
    process.exit(1);
  }
};

run();
