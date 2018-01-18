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

// This came from React Native's circle.yml
const token = 'e622517d9f1136ea8900' + '07c6373666312cdfaa69';
spawn(path.join('node_modules', '.bin', 'danger-ci' + extension), [], {
  // Allow colors to pass through
  stdio: 'inherit',
  env: {
    ...process.env,
    DANGER_GITHUB_API_TOKEN: token,
  },
}).on('close', function(code) {
  if (code !== 0) {
    console.error('Danger failed');
  } else {
    console.log('Danger passed');
  }

  process.exit(code);
});
