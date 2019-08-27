#!/usr/bin/env node

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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
