#!/usr/bin/env node

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var fs = require('fs');
var execSync = require('child_process').execSync;

function escape(value) {
  return '\'' + value.replace(/'/g, "'\\''") + '\'';
}

function exec(command) {
  console.log('>', command.replace(process.env.GITHUB_TOKEN, '************'));
  return execSync(command).toString();
}

if (process.env.TRAVIS_REPO_SLUG) {
  if (process.env.TRAVIS_BRANCH !== 'master') {
    console.error('facts-tracker: Branch is not master, exiting...');
    process.exit(1);
  }

  if (process.env.TRAVIS_PULL_REQUEST !== 'false') {
    console.error('facts-tracker: This is a pull request, exiting...');
    process.exit(1);
  }

  if (!process.env.GITHUB_USER ||
      !process.env.GITHUB_TOKEN) {
    console.error(
      'In order to use facts-tracker, you need to configure a ' +
      'few environment variables in order to be able to commit to the ' +
      'repository. Follow those steps to get you setup:\n' +
      '\n' +
      'Go to https://github.com/settings/tokens/new\n' +
      ' - Fill "Token description" with "facts-tracker for ' + process.env.TRAVIS_REPO_SLUG + '"\n' +
      ' - Check "public_repo"\n' +
      ' - Press "Generate Token"\n' +
      '\n' +
      'In a different tab, go to https://travis-ci.org/' + process.env.TRAVIS_REPO_SLUG + '/settings\n' +
      ' - Make sure "Build only if .travis.yml is present" is ON\n' +
      ' - Fill "Name" with "GITHUB_TOKEN" and "Value" with the token you just generated. Press "Add"\n' +
      ' - Fill "Name" with "GITHUB_USER" and "Value" with the name of the account you generated the token with. Press "Add"\n' +
      '\n' +
      'Once this is done, commit anything to the repository to restart Travis and it should work :)'
    );
    process.exit(1);
  }

  exec(
    'echo "machine github.com ' +
    'login ' + escape(process.env.GITHUB_USER) + ' ' +
    'password ' + escape(process.env.GITHUB_TOKEN) +
    '" > ~/.netrc'
  );
  var remoteOriginChanged = true;
  exec('git remote rename origin __old_origin');
  exec(
    'git remote add origin https://' + escape(process.env.GITHUB_TOKEN) +
    '@github.com/' + escape(process.env.TRAVIS_REPO_SLUG)
  );
  exec(
    'git config --global user.name ' +
    escape(process.env.GITHUB_USER_NAME || 'facts-tracker')
  );
  exec(
    'git config --global user.email ' +
    escape(process.env.GITHUB_USER_EMAIL || 'facts-tracker@no-reply.github.com')
  );
}

if (process.argv.length <= 2) {
  console.error('Usage: facts-tracker <name1> <value1> <name2> <value2>...');
  process.exit(1);
}

var currentBranch = exec('git rev-parse --abbrev-ref HEAD').trim();
var currentCommitHash = exec('git rev-parse HEAD').trim();
var currentTimestamp = new Date().toISOString()
  .replace('T', ' ')
  .replace(/\..+/, '');

if (exec('git status --porcelain')) {
  console.error('facts-tracker: `git status` is not clean, aborting.')
  process.exit(1);
}

function checkoutFactsBranch() {
  exec('git fetch');
  try {
    exec('git checkout facts');
  } catch(e) {
    exec('git checkout --orphan facts');
    exec('rm `git ls-files`');
    return;
  }

  try {
    exec('git rebase origin/facts');
  } catch(e) {
    exec('git rebase --abort');
    exec('git checkout origin/facts');
    exec('git branch -D facts');
    exec('git checkout facts');
  }
}
checkoutFactsBranch();

for (var i =  2; i < process.argv.length; i += 2) {
  var name = process.argv[i].trim();
  var value = process.argv[i + 1];
  if (value.indexOf('\n') !== -1) {
    console.error(
      'facts-tracker: skipping', name,
      'as the value contains new lines:', value
    );
    continue;
  }

  var filename = name + '.txt';
  try {
    var lastLine = exec('tail -n 1 ' + escape(filename));
  } catch(e) {
    // ignore error
  }
  var lastValue = lastLine && lastLine
    .replace(/^[^\t]+\t[^\t]+\t/, '') // commit hash \t timestamp \t
    .slice(0, -1); // trailing \n

  if (value !== lastValue) {
    fs.appendFileSync(
      filename,
      currentCommitHash + '\t' + currentTimestamp + '\t' + value + '\n'
    );    
  }

  console.log(name, value);
}

if (exec('git status --porcelain')) {
  exec('git add --all');
  exec('git commit -m "Adding facts for ' + escape(currentCommitHash) + '"');
} else {
  console.log('facts-tracker: nothing to update');
}

exec('git push origin facts');
exec('git checkout ' + escape(currentBranch));

if (remoteOriginChanged) {
  exec('git remote remove origin');
  exec('git remote rename __old_origin origin');
}
