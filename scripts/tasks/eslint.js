/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const lintOnFiles = require('../eslint');
const {es6Path, es5Path, esNextPath} = require('../shared/esPath');

const esNextReport = lintOnFiles({
  ecmaVersion: 'next',
  filePatterns: esNextPath,
});
const es6Report = lintOnFiles({ecmaVersion: '6', filePatterns: es6Path});
const es5Report = lintOnFiles({ecmaVersion: '5', filePatterns: es5Path});

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
