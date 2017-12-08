/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const lintOnFiles = require('../eslint');
const {es5Path} = require('../shared/esPath');

const es6Report = lintOnFiles({isES6: true, filePatterns: ['.']});
const es5Report = lintOnFiles({isES6: false, filePatterns: es5Path});

if (
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
