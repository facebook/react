/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {execSync} from 'child_process';
import {writeFileSync, mkdirSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'commits.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const vIndex = args.indexOf('-v');
  if (vIndex === -1 || vIndex + 1 >= args.length) {
    console.error('Usage: node gen-data.mjs -v <version>');
    console.error('Example: node gen-data.mjs -v 19.2.0');
    process.exit(1);
  }
  return args[vIndex + 1];
}

function resolveTag(version) {
  const tag = version.startsWith('v') ? version : `v${version}`;
  try {
    execSync(`git tag -l "${tag}" | grep -q .`, {stdio: 'pipe'});
  } catch {
    console.error(`Error: git tag "${tag}" not found.`);
    console.error(
      'Available recent tags:',
      execSync('git tag --sort=-creatordate | head -5').toString().trim()
    );
    process.exit(1);
  }
  return tag;
}

function resolveGitHubUsernames(commits, repo) {
  // Dedupe by author name — only need one commit per unique author
  const authorToHash = new Map();
  for (const commit of commits) {
    if (!authorToHash.has(commit.author)) {
      authorToHash.set(commit.author, commit.fullHash);
    }
  }

  const authorToUsername = new Map();
  const entries = Array.from(authorToHash.entries());
  console.log(`Resolving GitHub usernames for ${entries.length} unique authors...`);

  for (const [author, hash] of entries) {
    try {
      const login = execSync(
        `gh api repos/${repo}/commits/${hash} --jq '.author.login'`,
        {stdio: ['pipe', 'pipe', 'pipe'], timeout: 10000}
      )
        .toString()
        .trim();
      if (login && login !== 'null') {
        authorToUsername.set(author, login);
      }
    } catch {
      // Silently skip — will fall back to display name
    }
  }

  console.log(`Resolved ${authorToUsername.size}/${entries.length} usernames.`);
  return authorToUsername;
}

function getCommits(lastRelease) {
  const listOfCommits = execSync(
    `git log --pretty=format:"%h|%ai|%aN|%ae" ${lastRelease}...`
  ).toString();

  const summary = execSync(
    `git log --pretty=format:"%s" ${lastRelease}...`
  )
    .toString()
    .split('\n');

  const body = execSync(
    `git log --pretty=format:"%b<!----!>" ${lastRelease}...`
  )
    .toString()
    .split('<!----!>\n');

  const commits = listOfCommits.split('\n').map((commitMessage, index) => {
    const diffMatch = body[index]?.match(/D\d+/);
    const diff = diffMatch != null && diffMatch[0];
    const [hash, date, name] = commitMessage.split('|');
    return {
      hash: hash.slice(0, 7),
      fullHash: hash,
      summary: summary[index],
      message: body[index],
      author: name,
      diff,
      date,
    };
  });

  return commits;
}

// Detect the GitHub repo from the git remote
function getRepo() {
  try {
    const remote = execSync('git remote get-url origin', {stdio: 'pipe'})
      .toString()
      .trim();
    const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    // fall through
  }
  return 'facebook/react';
}

const version = parseArgs();
const lastRelease = resolveTag(version);
const commits = getCommits(lastRelease);
const repo = getRepo();
const usernameMap = resolveGitHubUsernames(commits, repo);

// Attach github username to each commit
for (const commit of commits) {
  const username = usernameMap.get(commit.author);
  if (username) {
    commit.github = username;
  }
}

mkdirSync(OUTPUT_DIR, {recursive: true});
writeFileSync(OUTPUT_FILE, JSON.stringify({lastRelease, commits}, null, 2));

console.log(
  `Wrote ${commits.length} commits (since ${lastRelease}) to data/commits.json`
);
