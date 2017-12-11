/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const minimatch = require('minimatch');
const CLIEngine = require('eslint').CLIEngine;
const listChangedFiles = require('../shared/listChangedFiles');
const {es5Paths, esNextPaths} = require('../shared/pathsByLanguageVersion');

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
  let errorCount = 0;
  let warningCount = 0;
  let output = '';
  [
    runESLintOnFilesWithOptions(allPaths, onlyChanged, {
      configFile: `${__dirname}/eslintrc.default.js`,
      ignorePattern: [...es5Paths, ...esNextPaths],
    }),
    runESLintOnFilesWithOptions(esNextPaths, onlyChanged, {
      configFile: `${__dirname}/eslintrc.esnext.js`,
    }),
    runESLintOnFilesWithOptions(es5Paths, onlyChanged, {
      configFile: `${__dirname}/eslintrc.es5.js`,
    }),
  ].forEach(result => {
    errorCount += result.errorCount;
    warningCount += result.warningCount;
    output += result.output;
  });
  console.log(output);
  return errorCount === 0 && warningCount === 0;
}

module.exports = runESLint;
