/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const lintOnFiles = require('../eslint');
const listChangedFiles = require('../shared/listChangedFiles');
const judgeJSFilesVersion = require('../shared/judgeJSFilesVersion');

const changedFiles = [...listChangedFiles()];
const jsFiles = changedFiles.filter(file => file.match(/.js$/g));
const {es5Files, es6Files} = judgeJSFilesVersion(jsFiles);

const es6Report = lintOnFiles({isES6: true, filePatterns: es6Files});
const es5Report = lintOnFiles({isES6: false, filePatterns: es5Files});

if (
  es6Report.errorCount > 0 ||
  getSourceCodeWarnings(es6Report) ||
  es5Report.errorCount > 0 ||
  getSourceCodeWarnings(es5Report)
) {
  console.log('Lint failed for changed files.');
  process.exit(1);
} else {
  console.log('Lint passed for changed files.');
}

// Prevents failing if the only warnings are about ignored files (#11615)
function getSourceCodeWarnings({warningCount, results}) {
  const ignoreWanings = results.filter(
    ({messages}) => messages[0] && messages[0].message.includes('File ignored')
  );
  return warningCount > 0 ? warningCount !== ignoreWanings.length : false;
}
