/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const chalk = require('chalk');
const builder = require('junit-report-builder');

/**
 * Returns whether JUnit report generation mode is enabled. The activation is done through circleci
 * configuration file
 *
 * @returns {boolean} Whether JUnit report generation mode is enabled
 */
const isJUnitEnabled = () => process.env.REPORT_FORMATTER === 'junit';

/**
 * Returns the file path  to the report corresponding to the provided build step
 * @param {string} buildStep The build step for which a report will be generated
 * @returns {string} The file path  to the report corresponding to the provided build step
 */
const reportFilePath = buildStep =>
  path.join(process.env.REPORT_DIR, `${buildStep}-results.xml`);

/**
 * Writes the content of Junit report within the reports directory
 *
 * @param {String} fileNamePrefix The report file name prefix
 * @param {String} content The content of the report
 */
const writeContent = (fileNamePrefix, content) => {
  const filePath = reportFilePath(fileNamePrefix);
  mkdirp.sync(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
};

/**
 * Writes a JUnit report for a given build step
 *
 * @param {string} buildStep The build step name
 * @param {any} data The data that will be part of the report if the build step has failed
 * @param {boolean} stepHasSucceeded Whether the build step has failed
 */
const writeJUnitReport = (buildStep, data, stepHasSucceeded) => {
  const reportPath = reportFilePath(buildStep);
  console.log(chalk.gray(`Starting to write the report in ${reportPath}`));
  const suite = builder.testSuite().name(buildStep);
  const testCase = suite
    .testCase()
    .className(buildStep)
    .name('single-test');
  if (!stepHasSucceeded) {
    testCase.failure(data);
  }
  builder.writeTo(reportPath);
  console.log(
    chalk.gray(
      `Finished writing the report in ${reportPath} for the build step ${buildStep}`
    )
  );
};

module.exports = {
  isJUnitEnabled,
  writeJUnitReport,
  writeContent,
};
