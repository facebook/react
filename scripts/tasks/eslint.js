/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const lintOnFiles = require('../eslint');
const {nodePath, npmPath, sourcePath} = require('../shared/esPath');

const esNextReport = lintOnFiles({
  ecmaVersion: 'next',
  filePatterns: sourcePath,
});
const es6Report = lintOnFiles({ecmaVersion: '6', filePatterns: nodePath});
const es5Report = lintOnFiles({ecmaVersion: '5', filePatterns: npmPath});

if (
  esNextReport.errorCount > 0 ||
  esNextReport.warningCount > 0 ||
  es6Report.errorCount > 0 ||
  es6Report.warningCount > 0 ||
  es5Report.errorCount > 0 ||
  es5Report.warningCount
) {
  console.log('Lint failed.');
  process.exit(1);
} else {
  console.log('Lint passed.');
}
