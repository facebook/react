/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const CLIEngine = require('eslint').CLIEngine;
const listChangedFiles = require('../shared/listChangedFiles');
const {
  npmPaths,
  nodePaths,
  sourcePaths,
} = require('../shared/pathsByLanguageVersion');

const sourceOptions = {
  configFile: `${__dirname}/eslintrc.source.js`,
  ignorePattern: [...npmPaths, ...nodePaths],
};
const nodeOptions = {
  configFile: `${__dirname}/eslintrc.node.js`,
  ignorePattern: [...npmPaths, ...sourcePaths],
};
const npmOptions = {
  configFile: `${__dirname}/eslintrc.npm.js`,
  ignorePattern: [...nodePaths, ...sourcePaths],
};

function runESLintOnFilesWithOptions(filePatterns, options) {
  const cli = new CLIEngine(options);
  const formatter = cli.getFormatter();
  const report = cli.executeOnFiles(filePatterns);

  // When using `ignorePattern`, eslint will show `File ignored...` warning message when match ignore file.
  // We don't care about it, but there is currently no way to tell ESLint to not emit it.
  const messages = report.results.filter(item => {
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

function runESLint({onlyChanged}) {
  if (typeof onlyChanged !== 'boolean') {
    throw new Error('Pass options.onlyChanged as a boolean.');
  }
  const changedFiles = onlyChanged ? [...listChangedFiles()] : null;
  let errorCount = 0;
  let warningCount = 0;
  let output = '';
  [
    runESLintOnFilesWithOptions(
      onlyChanged ? changedFiles : sourcePaths,
      sourceOptions
    ),
    runESLintOnFilesWithOptions(
      onlyChanged ? changedFiles : nodePaths,
      nodeOptions
    ),
    runESLintOnFilesWithOptions(
      onlyChanged ? changedFiles : npmPaths,
      npmOptions
    ),
  ].forEach(result => {
    errorCount += result.errorCount;
    warningCount += result.warningCount;
    output += result.output;
  });
  console.log(output);
  return errorCount === 0 && warningCount === 0;
}

module.exports = runESLint;
