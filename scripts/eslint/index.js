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

const allPaths = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'];

let changedFiles = null;
let eslintCache = new Map();

async function runESLintOnFilesWithOptions(filePatterns, onlyChanged, options = {}) {
  const defaultOptions = {
    cache: true,
    cacheLocation: '.eslintcache',
    fix: false,
    maxWarnings: 100,
    ...options
  };

  const cli = new CLIEngine(defaultOptions);
  const formatter = cli.getFormatter('stylish');

  if (onlyChanged && changedFiles === null) {
    try {
      changedFiles = [...await listChangedFiles()];
      changedFiles.forEach(file => {
        if (!eslintCache.has(file)) {
          eslintCache.set(file, null);
        }
      });
    } catch (error) {
      console.error('Error getting changed files:', error);
      throw error;
    }
  }
  const finalFilePatterns = onlyChanged
    ? intersect(changedFiles, filePatterns)
    : filePatterns;
  const report = cli.executeOnFiles(finalFilePatterns);

  if (defaultOptions.fix === true) {
    CLIEngine.outputFixes(report);
  }

  const messages = report.results.filter(item => {
    if (!onlyChanged) return true;

    const ignoreMessage = 'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.';
    const isIgnored = item.messages[0]?.message === ignoreMessage;

    eslintCache.set(item.filePath, isIgnored ? null : item);

    return !isIgnored;
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

async function runESLint({onlyChanged, fix = false, maxWarnings = 100}) {
  if (typeof onlyChanged !== 'boolean') {
    throw new Error('Pass options.onlyChanged as a boolean.');
  }

  try {
    const {errorCount, warningCount, output} = await runESLintOnFilesWithOptions(
      allPaths,
      onlyChanged,
      { fix, maxWarnings }
    );

    console.log(output);

    if (errorCount > 0) {
      console.error(`Found ${errorCount} errors.`);
    }
    if (warningCount > 0) {
      console.warn(`Found ${warningCount} warnings.`);
    }

    return errorCount === 0 && warningCount <= maxWarnings;
  } catch (error) {
    console.error('ESLint execution failed:', error);
    return false;
  }
}

module.exports = runESLint;
