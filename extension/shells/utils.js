const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { resolve } = require('path');

function getGitCommit() {
  return execSync('git show -s --format=%h')
    .toString()
    .trim();
}

function getGitHubURL() {
  // HACK We are in the middle of migrating;
  // For now, forcefully direct people to the new repository-
  // even though we may be deploying from the old repo.
  return 'https://github.com/facebook/react';

  /* TODO potentially replace this with an fb.me URL (assuming it can forward the query params)
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
  */
}

function getVersionString() {
  const packageVersion = JSON.parse(
    readFileSync(resolve(__dirname, '../package.json'))
  ).version;

  const commit = getGitCommit();

  return `${packageVersion}-${commit}`;
}

module.exports = { getGitCommit, getGitHubURL, getVersionString };
