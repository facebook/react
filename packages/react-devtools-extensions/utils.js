/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('child_process');
const {readFileSync} = require('fs');
const {resolve} = require('path');

const DARK_MODE_DIMMED_WARNING_COLOR = 'rgba(250, 180, 50, 0.5)';
const DARK_MODE_DIMMED_ERROR_COLOR = 'rgba(250, 123, 130, 0.5)';
const DARK_MODE_DIMMED_LOG_COLOR = 'rgba(125, 125, 125, 0.5)';
const LIGHT_MODE_DIMMED_WARNING_COLOR = 'rgba(250, 180, 50, 0.75)';
const LIGHT_MODE_DIMMED_ERROR_COLOR = 'rgba(250, 123, 130, 0.75)';
const LIGHT_MODE_DIMMED_LOG_COLOR = 'rgba(125, 125, 125, 0.75)';

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
  DARK_MODE_DIMMED_WARNING_COLOR,
  DARK_MODE_DIMMED_ERROR_COLOR,
  DARK_MODE_DIMMED_LOG_COLOR,
  LIGHT_MODE_DIMMED_WARNING_COLOR,
  LIGHT_MODE_DIMMED_ERROR_COLOR,
  LIGHT_MODE_DIMMED_LOG_COLOR,
  GITHUB_URL,
  getGitCommit,
  getVersionString,
};
