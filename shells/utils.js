const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { resolve } = require('path');

function getGitCommit() {
  return execSync('git show -s --format=%h')
    .toString()
    .trim();
}

function getGitHubURL() {
  // TODO potentially replac this with an fb.me URL (if it can forward the query params)
  return execSync('git remote get-url origin')
    .toString()
    .trim()
    .replace(':', '/')
    .replace('git@', 'https://')
    .replace('.git', '');
}

function getVersionString() {
  const packageVersion = JSON.parse(
    readFileSync(resolve(__dirname, '../package.json'))
  ).version;

  const commit = getGitCommit();

  return `${packageVersion}-${commit}`;
}

module.exports = { getGitCommit, getGitHubURL, getVersionString };
