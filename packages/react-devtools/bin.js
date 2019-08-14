#!/usr/bin/env node

// @flow

const electron = require('electron');
const spawn = require('cross-spawn');
const argv = process.argv.slice(2);
const pkg = require('./package.json');
const updateNotifier = require('update-notifier');

// notify if there's an update
updateNotifier({pkg}).notify({defer: false});

const result = spawn.sync(electron, [require.resolve('./app')].concat(argv), {
  stdio: 'ignore',
});

process.exit(result.status);
