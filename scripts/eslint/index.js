/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const minimatch = require('minimatch');
const CLIEngine = require('eslint').CLIEngine;
const listChangedFiles = require('../shared/listChangedFiles');

const allPaths = ['**/*.js'];

let changedFiles = null;

function runESLintOnFilesWithOptions(filePatterns, onlyChanged, options) {
  const cli = new CLIEngine(options);
  const formatter = cli.getFormatter();

  if (onlyChanged && changedFiles === null) {
    // Calculate lazily.
    changedFiles = [...listChangedFiles()];
  }
  const finalFilePatterns = onlyChanged
    ? intersect(changedFiles, filePatterns)
    : filePatterns;
  const report = cli.executeOnFiles(finalFilePatterns);

  // When using `ignorePattern`, eslint will show `File ignored...` warnings for any ignores.
  // We don't care because we *expect* some passed files will be ignores if `ignorePattern` is used.
  const messages = report.results.filter(item => {
    if (!onlyChanged) {
      // Don't suppress the message on a full run.
      // We only expect it to happen for "only changed" runs.
      return true;
    }
    const ignoreMessage =
      'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.';
    return !(item.messages[0] && item.messages[0].message === ignoreMessage);
  });

  const ignoredMessageCount = report.results.length - messages.length;
  return {
    output: formatter(messages),
    errorCount: report.errorCount,
    warningCount: report.warningCount - ignoredMessageCount,
  };
}

function intersect(files, patterns) {
  let intersection = [];
  patterns.forEach(pattern => {
    intersection = [
      ...intersection,
      ...minimatch.match(files, pattern, {matchBase: true}),
    ];
  });
  return [...new Set(intersection)];
}

function runESLint({onlyChanged}) {
  if (typeof onlyChanged !== 'boolean') {
    throw new Error('Pass options.onlyChanged as a boolean.');
  }
  const {errorCount, warningCount, output} = runESLintOnFilesWithOptions(
    allPaths,
    onlyChanged
  );
  console.log(output);
  return errorCount === 0 && warningCount === 0;
}

module.exports = runESLint;
