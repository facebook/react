#!/usr/bin/env node

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var execFileSync = require('child_process').execFileSync;

var cwd = null;
function exec(command, args) {
  console.error('>', [command].concat(args));
  var options = {};
  if (cwd) {
    options.cwd = cwd;
  }
  return execFileSync(command, args, options).toString();
}

var isCI = !!process.env.TRAVIS_REPO_SLUG;

if (isCI) {
  var branch = process.env.TRAVIS_BRANCH || process.env.CIRCLE_BRANCH;
  var isPullRequest =
    (!!process.env.TRAVIS_PULL_REQUEST &&
      process.env.TRAVIS_PULL_REQUEST !== 'false') ||
    !!process.env.CI_PULL_REQUEST;

  if (branch !== 'master') {
    console.error('facts-tracker: Branch is not master, exiting...');
    process.exit(0);
  }

  if (isPullRequest) {
    console.error('facts-tracker: This is a pull request, exiting...');
    process.exit(0);
  }

  if (!process.env.GITHUB_USER) {
    console.error(
      'In order to use facts-tracker, you need to configure a ' +
        'few environment variables in order to be able to commit to the ' +
        'repository. Follow those steps to get you setup:\n' +
        '\n' +
        'Go to https://github.com/settings/tokens/new\n' +
        ' - Fill "Token description" with "facts-tracker for ' +
        process.env.TRAVIS_REPO_SLUG +
        '"\n' +
        ' - Check "public_repo"\n' +
        ' - Press "Generate Token"\n' +
        '\n' +
        'In a different tab, go to https://travis-ci.org/' +
        process.env.TRAVIS_REPO_SLUG +
        '/settings\n' +
        ' - Make sure "Build only if .travis.yml is present" is ON\n' +
        ' - Fill "Name" with "GITHUB_USER" and "Value" with the name of the ' +
        'account you generated the token with. Press "Add"\n' +
        '\n' +
        'Once this is done, commit anything to the repository to restart ' +
        'Travis and it should work :)'
    );
    process.exit(1);
  }

  exec('git', [
    'config',
    '--global',
    'user.name',
    process.env.GITHUB_USER_NAME || 'facts-tracker',
  ]);
  exec('git', [
    'config',
    '--global',
    'user.email',
    process.env.GITHUB_USER_EMAIL || 'facts-tracker@no-reply.github.com',
  ]);
}

if (process.argv.length <= 2) {
  console.error('Usage: facts-tracker <name1> <value1> <name2> <value2>...');
  process.exit(1);
}

function getRepoSlug() {
  if (isCI) {
    return process.env.TRAVIS_REPO_SLUG;
  }

  var remotes = exec('git', ['remote', '-v']).split('\n');
  for (var i = 0; i < remotes.length; ++i) {
    var match = remotes[i].match(/^origin\t[^:]+:([^\.]+).+\(fetch\)/);
    if (match) {
      return match[1];
    }
  }

  console.error('Cannot find repository slug, sorry.');
  process.exit(1);
}

var repoSlug = getRepoSlug();
var currentCommitHash = exec('git', ['rev-parse', 'HEAD']).trim();
var currentTimestamp = new Date()
  .toISOString()
  .replace('T', ' ')
  .replace(/\..+/, '');

function checkoutFactsFolder() {
  var factsFolder = '../' + repoSlug.split('/')[1] + '-facts';
  if (!fs.existsSync(factsFolder)) {
    var repoURL;
    if (isCI) {
      repoURL =
        'https://' +
        process.env.GITHUB_USER +
        '@github.com/' +
        repoSlug +
        '.git';
    } else {
      repoURL = 'git@github.com:' + repoSlug + '.git';
    }

    exec('git', [
      'clone',
      '--branch',
      'facts',
      '--depth=5',
      repoURL,
      factsFolder,
    ]);
  }

  cwd = path.resolve(factsFolder);
  exec('git', ['fetch']);
  if (exec('git', ['status', '--porcelain'])) {
    console.error('facts-tracker: `git status` is not clean, aborting.');
    process.exit(1);
  }
  exec('git', ['rebase', 'origin/facts']);
}
checkoutFactsFolder();

for (var i = 2; i < process.argv.length; i += 2) {
  var name = process.argv[i].trim();
  var value = process.argv[i + 1];
  if (value.indexOf('\n') !== -1) {
    console.error(
      'facts-tracker: skipping',
      name,
      'as the value contains new lines:',
      value
    );
    continue;
  }

  var filename = name + '.txt';
  try {
    var lastLine = exec('tail', ['-n', '1', filename]);
  } catch (e) {
    // ignore error
  }
  var lastValue =
    lastLine && lastLine.replace(/^[^\t]+\t[^\t]+\t/, '').slice(0, -1); // commit hash \t timestamp \t // trailing \n

  if (value !== lastValue) {
    fs.appendFileSync(
      path.resolve(cwd, filename),
      currentCommitHash + '\t' + currentTimestamp + '\t' + value + '\n'
    );
  }

  console.log(name);
  console.log(lastValue);
  console.log(value);
}

if (exec('git', ['status', '--porcelain'])) {
  exec('git', ['add', '--all']);
  exec('git', ['commit', '-m', 'Adding facts for ' + currentCommitHash]);
  exec('git', ['push', 'origin', 'facts']);
} else {
  console.error('facts-tracker: nothing to update');
}
cwd = null;
