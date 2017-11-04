/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const path = require('path');
const execFileSync = require('child_process').execFileSync;
const spawn = require('child_process').spawn;
const extension = process.platform === 'win32' ? '.cmd' : '';
const eslint = path.join('node_modules', '.bin', 'eslint' + extension);

function exec(
  command,
  args,
  options = {
    stdio: 'pipe',
    encoding: 'utf-8',
  }
) {
  return execFileSync(command, args, options);
}

function spawnCommand(
  command,
  args,
  options = {
    stdio: 'pipe',
    encoding: 'utf-8',
  }
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.on('close', code => code === 0 ? resolve() : reject());
  });
}

const mergeBase = exec('git', ['merge-base', 'HEAD', 'master']).trim();
const changedFiles = exec('git', [
  'diff',
  '--name-only',
  '--diff-filter=ACMRTUB',
  mergeBase,
])
  .trim()
  .toString()
  .split('\n');
const jsFiles = changedFiles.filter(file => file.match(/.js$/g));
const jsFilesPromises = jsFiles.map(file => spawnCommand(eslint, [file], {stdio: 'inherit'}));
Promise.all(jsFilesPromises)
  .then(() => console.log('Linc passed'))
  .catch(e => {
    console.log('Linc failed');
    process.exit(1);
  });
