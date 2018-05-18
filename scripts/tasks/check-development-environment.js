/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';
const execFileSync = require('child_process').execFileSync;
const gte = require('semver').gte;
const yarnCmds = ['yarnpkg', 'yarn'];

function getVersion(cmd) {
  return execFileSync(cmd, ['--version'], {
    encoding: 'utf-8',
  }).trim();
}

function getLocalYarnVersion() {
  let yarnVersion;
  let caughtError = null;

  const isYarnInstalled = yarnCmds.some(function(cmd) {
    try {
      yarnVersion = getVersion(cmd);
      return true;
    } catch (err) {
      caughtError = err;
      return false;
    }
  });

  if (isYarnInstalled) {
    return yarnVersion;
  } else {
    if (caughtError.code === 'ENOENT') {
      console.error(
        'Could not find a Yarn installation. Please make sure Yarn is installed and ' +
          'that the `yarn` command works in your command line shell.'
      );
    } else {
      throw caughtError;
    }

    process.exit(1);
  }
}

const MIN_YARN_VERSION = '1.2.1';
const localYarnVersion = getLocalYarnVersion();

if (!gte(localYarnVersion, MIN_YARN_VERSION)) {
  console.log(
    'Your local Yarn version lower than mininal yarn version. Expected >= %s, saw %s.',
    MIN_YARN_VERSION,
    localYarnVersion
  );
  process.exit(1);
}
