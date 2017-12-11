/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const CLIEngine = require('eslint').CLIEngine;
const {
  npmPath,
  nodePath,
  sourcePath,
} = require('../shared/pathsByLanguageVersion');

const npmOptions = {
  configFile: `${__dirname}/eslintrc.npm.js`,
  ignorePattern: [...nodePath, ...sourcePath],
};

const nodeOptions = {
  configFile: `${__dirname}/eslintrc.node.js`,
  ignorePattern: [...npmPath, ...sourcePath],
};

const sourceOptions = {
  configFile: `${__dirname}/eslintrc.source.js`,
  ignorePattern: [...npmPath, ...nodePath],
};

module.exports = function lintOnFiles({ecmaVersion, filePatterns}) {
  let options;
  switch (ecmaVersion) {
    case '5':
      options = npmOptions;
      break;
    case '6':
      options = nodeOptions;
      break;
    case 'next':
      options = sourceOptions;
      break;
    default:
      console.error('ecmaVersion only accpet value: "5", "6", "next"');
  }

  const cli = new CLIEngine({...options});
  const formatter = cli.getFormatter();
  const report = cli.executeOnFiles(filePatterns);

  // When using `ignorePattern`, eslint will show `File ignored...` warning message when match ignore file.
  // Currently, the only way to turn off this warning message is to set quiet = true.
  // But it will remove `all warnings`, it's not appropriate to turn off other warning message
  // So that's why we filter out the ignore pattern message.
  // related issue: https://github.com/eslint/eslint/issues/5623
  const filteredReport = report.results.filter(item => {
    const ignoreMessage =
      'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.';
    return !(item.messages[0] && item.messages[0].message === ignoreMessage);
  });
  const formattedResults = formatter(filteredReport);
  console.log(formattedResults);
  return report;
};
