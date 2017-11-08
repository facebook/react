/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';
const execSync = require('child_process').execSync;

function getLocalYarnVersion() {
  return execSync('yarn --version', {
    encoding: 'utf-8',
  }).trim();
}

function gte(left, right) {
  left = left.split('.');
  right = right.split('.');

  return left.every((v, i) => {
    if (v >= right[i]) {
      return true;
    } else {
      return false;
    }
  });
}

const reactVersion = require('../../package.json').version;
const MIN_YARN_VERSION = '1.2.1';
const localYarnVersion = getLocalYarnVersion();

const pkgVersions = {
  'packages/react/package.json': require('../../packages/react/package.json')
    .version,
  'packages/react-dom/package.json': require('../../packages/react-dom/package.json')
    .version,
  'packages/react-test-renderer/package.json': require('../../packages/react-test-renderer/package.json')
    .version,
  'packages/shared/ReactVersion.js': require('../../packages/shared/ReactVersion'),
};

let allVersionsMatch = true;
Object.keys(pkgVersions).forEach(function(name) {
  const version = pkgVersions[name];
  if (version !== reactVersion) {
    allVersionsMatch = false;
    console.log(
      '%s version does not match package.json. Expected %s, saw %s.',
      name,
      reactVersion,
      version
    );
  }
});

if (!gte(localYarnVersion, MIN_YARN_VERSION)) {
  allVersionsMatch = false;
  console.log(
    'Your local %s version lower than mininal yarn version. Expected >= %s, saw %s.',
    'yarn',
    MIN_YARN_VERSION,
    localYarnVersion
  );
}

if (!allVersionsMatch) {
  process.exit(1);
}
