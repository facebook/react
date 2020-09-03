/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('child_process');
const {readFileSync} = require('fs');
const {resolve} = require('path');

function getGitCommit() {
  try {
    return execSync('git show -s --format=%h')
      .toString()
      .trim();
  } catch (error) {
    // Mozilla runs this command from a git archive.
    // In that context, there is no Git revision.
    return null;
  }
}

function getVersionString() {
  const packageVersion = JSON.parse(
    readFileSync(resolve(__dirname, './package.json')),
  ).version;

  const commit = getGitCommit();

  return `${packageVersion}-${commit}`;
}

module.exports = {
  getVersionString,
};
