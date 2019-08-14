#!/usr/bin/env node

'use strict';

const chromeLaunch = require('chrome-launch');
const {resolve} = require('path');

const EXTENSION_PATH = resolve('./chrome/build/unpacked');
const START_URL = 'https://facebook.github.io/react/';

chromeLaunch(START_URL, {
  args: [`--load-extension=${EXTENSION_PATH}`],
});
