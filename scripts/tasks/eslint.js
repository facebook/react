/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const lintOnFiles = require('../eslint');
const report = lintOnFiles(['.']);
if (report.errorCount > 0 || report.warningCount > 0) {
  console.log('Lint failed.');
  process.exit(1);
} else {
  console.log('Lint passed.');
}
