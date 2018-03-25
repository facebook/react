/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const path = require('path');
const spawn = require('child_process').spawn;

const extension = process.platform === 'win32' ? '.cmd' : '';

spawn(path.join('node_modules', '.bin', 'flow' + extension), ['check', '.'], {
  // Allow colors to pass through
  stdio: 'inherit',
}).on('close', function(code) {
  if (code !== 0) {
    console.error('Flow failed');
  } else {
    console.log('Flow passed');
  }

  process.exit(code);
});
