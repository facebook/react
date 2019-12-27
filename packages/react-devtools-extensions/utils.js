const {execSync} = require('child_process');
const {readFileSync} = require('fs');
const {resolve} = require('path');

const GITHUB_URL = 'https://github.com/facebook/react';

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
    readFileSync(
      resolve(__dirname, '..', 'react-devtools-core', './package.json'),
    ),
  ).version;

  const commit = getGitCommit();

  return `${packageVersion}-${commit}`;
}

module.exports = {
  GITHUB_URL,
  getGitCommit,
  getVersionString,
};
