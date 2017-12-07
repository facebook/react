/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const CLIEngine = require('eslint').CLIEngine;
const eslintPath = './scripts/eslint';

module.exports = function lintOnFiles({isES6, filePatterns}) {
  const configFile = isES6
    ? `${eslintPath}/es6Config.js`
    : `${eslintPath}/es5Config.js`;
  const cli = new CLIEngine({configFile});
  const formatter = cli.getFormatter();
  const report = cli.executeOnFiles(filePatterns);
  const formattedResults = formatter(report.results);
  console.log(formattedResults);
  return report;
};
