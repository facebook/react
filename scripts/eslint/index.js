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
const {isJUnitEnabled, writeContent} = require('../shared/reporting');

let changedFiles = null;

const allPaths = ['**/*.js'];

function runESLintOnFilesWithOptions(filePatterns, onlyChanged, options) {
  const cli = new CLIEngine(options);
  // stylish is the default ESLint formatter. We switch to JUnit formatter in the scope of circleci
  const formatter = cli.getFormatter(isJUnitEnabled() ? 'junit' : 'stylish');

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
  const eslintrcList = ['eslintrc.default', 'eslintrc.esnext', 'eslintrc.es5'];
  const esLintRuns = [
    runESLintOnFilesWithOptions(allPaths, onlyChanged, {
      configFile: `${__dirname}/${eslintrcList[0]}.js`,
      ignorePattern: [...es5Paths, ...esNextPaths],
    }),
    runESLintOnFilesWithOptions(esNextPaths, onlyChanged, {
      configFile: `${__dirname}/${eslintrcList[1]}.js`,
    }),
    runESLintOnFilesWithOptions(es5Paths, onlyChanged, {
      configFile: `${__dirname}/${eslintrcList[2]}.js`,
    }),
  ];
  esLintRuns.forEach((result, index) => {
    errorCount += result.errorCount;
    warningCount += result.warningCount;
    output += result.output;
    if (isJUnitEnabled()) {
      writeContent(eslintrcList[index], result.output);
    }
  });
  // Whether we store lint results in a file or not, we also log the results in the console
  console.log(output);
  return errorCount === 0 && warningCount === 0;
}

module.exports = runESLint;
