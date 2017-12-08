/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const CLIEngine = require('eslint').CLIEngine;
const eslintPath = './scripts/eslint';
const {es5Path, es6Path} = require('../shared/esPath');

module.exports = function lintOnFiles({isES6, filePatterns}) {
  const configFile = isES6
    ? `${eslintPath}/es6Config.js`
    : `${eslintPath}/es5Config.js`;

  const ignorePattern = isES6 ? es5Path : es6Path;
  const cli = new CLIEngine({configFile, ignorePattern});
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
