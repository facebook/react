/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const CLIEngine = require('eslint').CLIEngine;
const cli = new CLIEngine();
const formatter = cli.getFormatter();

module.exports = function lintOnFiles(filePatterns) {
  const report = cli.executeOnFiles(filePatterns);
  const formattedResults = formatter(report.results);
  console.log(formattedResults);
  return report;
};
