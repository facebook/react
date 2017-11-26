/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const lintOnFiles = require('../eslint');
const listChangedFiles = require('../shared/listChangedFiles');

const changedFiles = [...listChangedFiles()];
const jsFiles = changedFiles.filter(file => file.match(/.js$/g));

const report = lintOnFiles(jsFiles);
if (report.errorCount > 0 || report.warningCount > 0) {
  console.log('Lint failed for changed files.');
  process.exit(1);
} else {
  console.log('Lint passed for changed files.');
}
