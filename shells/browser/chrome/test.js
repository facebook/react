#!/usr/bin/env node

const chromeLaunch = require('chrome-launch'); // eslint-disable-line import/no-extraneous-dependencies
const { resolve } = require('path');

const EXTENSION_PATH = resolve('shells/browser/chrome/build/unpacked');
const START_URL = 'https://facebook.github.io/react/';

chromeLaunch(START_URL, {
  args: [`--load-extension=${EXTENSION_PATH}`],
});
