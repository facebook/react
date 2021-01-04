#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {Finder} = require('firefox-profile');
const {resolve} = require('path');
const {argv} = require('yargs');

const EXTENSION_PATH = resolve('./firefox/build/unpacked');
const START_URL = argv.url || 'https://reactjs.org/';

const main = async () => {
  const finder = new Finder();

  // Use default Firefox profile for testing purposes.
  // This prevents users from having to re-login-to sites before testing.
  const findPathPromise = new Promise((resolvePromise, rejectPromise) => {
    finder.getPath('default', (error, profile) => {
      if (error) {
        rejectPromise(error);
      } else {
        resolvePromise(profile);
      }
    });
  });

  const options = [
    `--source-dir=${EXTENSION_PATH}`,
    `--start-url=${START_URL}`,
    '--browser-console',
  ];

  try {
    const path = await findPathPromise;
    const trimmedPath = path.replace(' ', '\\ ');
    options.push(`--firefox-profile=${trimmedPath}`);
  } catch (err) {
    console.warn('Could not find default profile, using temporary profile.');
  }

  try {
    await exec(`web-ext run ${options.join(' ')}`);
  } catch (err) {
    console.error('`web-ext run` failed', err.stdout, err.stderr);
  }
};

main();
