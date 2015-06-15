/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var colors = require('./lib/colors');
var formatFailureMessage = require('./lib/utils').formatFailureMessage;
var formatMsg = require('./lib/utils').formatMsg;
var path = require('path');
var VerboseLogger = require('./lib/testLogger');

var FAIL_COLOR = colors.RED_BG + colors.BOLD;
var PASS_COLOR = colors.GREEN_BG + colors.BOLD;
var TEST_NAME_COLOR = colors.BOLD;

function DefaultTestReporter(customProcess) {
  this._process = customProcess || process;
}

DefaultTestReporter.prototype.log = function(str) {
  this._process.stdout.write(str + '\n');
};

DefaultTestReporter.prototype.onRunStart =
function(config, aggregatedResults) {
  this._config = config;
  this._printWaitingOn(aggregatedResults);
  if (this._config.verbose) {
    var verboseLogger = new VerboseLogger(this._config, this._process);
    this.verboseLog = verboseLogger.verboseLog.bind(verboseLogger);
  }
};

DefaultTestReporter.prototype.onTestResult =
function(config, testResult, aggregatedResults) {
  this._clearWaitingOn();

  var pathStr =
    config.rootDir
    ? path.relative(config.rootDir, testResult.testFilePath)
    : testResult.testFilePath;

  if (testResult.testExecError) {
    this.log(this._getResultHeader(false, pathStr));
    this.log(testResult.testExecError);
    return false;
  }

  var allTestsPassed = testResult.numFailingTests === 0;

  var testRunTime =
    testResult.perfStats
    ? (testResult.perfStats.end - testResult.perfStats.start) / 1000
    : null;

  var testRunTimeString = '(' + testRunTime + 's)';
  if (testRunTime > 2.5) {
    testRunTimeString = this._formatMsg(testRunTimeString, FAIL_COLOR);
  }

  var resultHeader = this._getResultHeader(allTestsPassed, pathStr, [
    testRunTimeString
  ]);

  /*
  if (config.collectCoverage) {
    // TODO: Find a nice pretty way to print this out
  }
  */

  this.log(resultHeader);
  if (config.verbose) {
    this.verboseLog(testResult.testResults, resultHeader);
  }

  testResult.logMessages.forEach(this._printConsoleMessage.bind(this));

  if (!allTestsPassed) {
    var failureMessage = formatFailureMessage(testResult, !config.noHighlight);
    if (config.verbose) {
      aggregatedResults.postSuiteHeaders.push(
        resultHeader,
        failureMessage
      );
    } else {
      this.log(failureMessage);
    }

    if (config.bail) {
      this.onRunComplete(config, aggregatedResults);
      this._process.exit(0);
    }
  }

  this._printWaitingOn(aggregatedResults);
};

DefaultTestReporter.prototype.onRunComplete =
function (config, aggregatedResults) {
  var numFailedTests = aggregatedResults.numFailedTests;
  var numPassedTests = aggregatedResults.numPassedTests;
  var numTotalTests = aggregatedResults.numTotalTests;
  var runTime = (Date.now() - aggregatedResults.startTime) / 1000;

  if (numTotalTests === 0) {
    return;
  }

  if (config.verbose) {
    if (aggregatedResults.postSuiteHeaders.length > 0) {
      this.log(aggregatedResults.postSuiteHeaders.join('\n'));
    }
  }

  var results = '';
  if (numFailedTests) {
    results += this._formatMsg(
      numFailedTests + ' test' + (numFailedTests === 1 ? '' : 's') + ' failed',
      colors.RED + colors.BOLD
    );
    results += ', ';
  }
  results += this._formatMsg(
    numPassedTests + ' test' + (numPassedTests === 1 ? '' : 's') + ' passed',
    colors.GREEN + colors.BOLD
  );
  results += ' (' + numTotalTests + ' total)';

  this.log(results);
  this.log('Run time: ' + runTime + 's');
};

DefaultTestReporter.prototype._printConsoleMessage = function(msg) {
  switch (msg.type) {
    case 'dir':
    case 'log':
      this._process.stdout.write(msg.data);
      break;
    case 'warn':
      this._process.stderr.write(
        this._formatMsg(msg.data, colors.YELLOW)
      );
      break;
    case 'error':
      this._process.stderr.write(
        this._formatMsg(msg.data, colors.RED)
      );
      break;
    default:
      throw new Error('Unknown console message type!: ' + msg.type);
  }
};

DefaultTestReporter.prototype._clearWaitingOn = function() {
  // Don't write special chars in noHighlight mode
  // to get clean output for logs.
  var command = this._config.noHighlight
    ? '\n'
    : '\r\x1B[K';
  this._process.stdout.write(command);
};

DefaultTestReporter.prototype._formatMsg = function(msg, color) {
  return formatMsg(msg, color, this._config);
};

DefaultTestReporter.prototype._getResultHeader =
function (passed, testName, columns) {
  var passFailTag = passed
    ? this._formatMsg(' PASS ', PASS_COLOR)
    : this._formatMsg(' FAIL ', FAIL_COLOR);

  return [
    passFailTag,
    this._formatMsg(testName, TEST_NAME_COLOR)
  ].concat(columns || []).join(' ');
};

DefaultTestReporter.prototype._printWaitingOn = function(aggregatedResults) {
  var completedTests =
    aggregatedResults.numPassedTests +
    aggregatedResults.numFailedTests;
  var remainingTests = aggregatedResults.numTotalTests - completedTests;
  if (remainingTests > 0) {
    var pluralTests = remainingTests === 1 ? 'test' : 'tests';
    this._process.stdout.write(
      this._formatMsg(
        'Waiting on ' + remainingTests + ' ' + pluralTests + '...',
        colors.GRAY + colors.BOLD
      )
    );
  }
};

module.exports = DefaultTestReporter;
