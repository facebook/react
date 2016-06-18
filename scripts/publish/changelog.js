#!/usr/bin/env node

'use strict';

/**
 * Just a small command-line wrapper around the conventional-changelog npm module
 * (https://www.npmjs.com/package/conventional-changelog), which also prepends
 * changes to CHANGELOG.md.
 *
 * Appends CHANGELOG.md with the changes between tag and HEAD.
 * NOTE: only `fix`, `feat`, `perf` and `revert` commits are used
 * see: https://github.com/conventional-changelog/conventional-changelog/blob/v0.2.1/presets/angular.js#L24
 */

var fs = require('fs');
var cl = require('conventional-changelog');
const exec = require('child_process').exec;

var changelogStream = fs.createWriteStream('CHANGELOG-delta.md');

if (process.argv.length < 3) {
  console.log('Usage: ./scripts/publish/changelog.js <start-tag>');
  process.exit(-1);
}

var config = {
  preset: 'angular',
  releaseCount: 1,
};

var prependDelta = function() {
  exec('cat CHANGELOG-delta.md CHANGELOG.md > CHANGELOG-new.md;' +
       'mv CHANGELOG-new.md CHANGELOG.md;' +
       'rm CHANGELOG-delta.md');
}

cl(config, null, {from: process.argv[2]}).on('error', function(err) {
            console.error('Failed to generate changelog: ' + err);
          }).pipe(changelogStream).on('close', prependDelta);
