const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { resolve } = require('path');

function getGitCommit() {
  return execSync('git show -s --format=%h')
    .toString()
    .trim();
}

function getGitHubURL() {
  // TODO potentially replace this with an fb.me URL (assuming it can forward the query params)
  const url = execSync('git remote get-url origin')
    .toString()
    .trim();

  if (url.startsWith('https://')) {
    return url.replace('.git', '');
  } else {
    return url
      .replace(':', '/')
      .replace('git@', 'https://')
      .replace('.git', '');
  }
}

function getVersionString() {
  const packageVersion = JSON.parse(
    readFileSync(resolve(__dirname, '../package.json'))
  ).version;

  const commit = getGitCommit();

  return `${packageVersion}-${commit}`;
}

module.exports = { getGitCommit, getGitHubURL, getVersionString };
