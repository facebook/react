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

// Facebook-Open-Source-Bot public_repo token
const token = 'b186c9a82bab3b08ec80' + 'c0818117619eec6f281a';
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
