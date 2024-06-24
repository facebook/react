/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('child_process');
const {readFileSync} = require('fs');
const {resolve} = require('path');

const GITHUB_URL = 'https://github.com/facebook/react';

function getGitCommit() {
  try {
    return execSync('git show -s --no-show-signature --format=%h')
      .toString()
      .trim();
  } catch (error) {
    // Mozilla runs this command from a git archive.
    // In that context, there is no Git revision.
    return null;
  }
}

function getVersionString(packageVersion = null) {
  if (packageVersion == null) {
    packageVersion = JSON.parse(
      readFileSync(
        resolve(__dirname, '..', 'react-devtools-core', './package.json'),
      ),
    ).version;
  }

  const commit = getGitCommit();

  return `${packageVersion}-${commit}`;
}

module.exports = {
  GITHUB_URL,
  getGitCommit,
  getVersionString,
};
