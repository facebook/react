/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var colors = require('../lib/colors');
var diff = require('diff');
var formatMsg = require('../lib/utils').formatMsg;
var jasmine = require('../../vendor/jasmine/jasmine-1.3.0').jasmine;
var Q = require('q');

var ERROR_TITLE_COLOR = colors.RED + colors.BOLD + colors.UNDERLINE;
var DIFFABLE_MATCHERS = {
  toBe: true,
  toNotBe: true,
  toEqual: true,
  toNotEqual: true
};
var LINEBREAK_REGEX = /[\r\n]/;

function JasmineReporter(config) {
  jasmine.Reporter.call(this);
  this._config = config || {};
  this._logs = [];
  this._resultsDeferred = Q.defer();
}

JasmineReporter.prototype = Object.create(jasmine.Reporter.prototype);

// All describe() suites have finished
JasmineReporter.prototype.reportRunnerResults = function(runner) {
  var testResults = [];

  // Find the top-level suite in order to flatten test results from there
  if (runner.suites().length) {
    runner.suites().forEach(function(suite) {
      if (suite.parentSuite === null) {
        this._extractSuiteResults(testResults, [], suite);
      }
    }, this);
  }

  var numFailingTests = 0;
  var numPassingTests = 0;
  testResults.forEach(function(testResult) {
    if (testResult.failureMessages.length > 0) {
      numFailingTests++;
    } else {
      numPassingTests++;
    }
  });

  this._resultsDeferred.resolve({
    numFailingTests: numFailingTests,
    numPassingTests: numPassingTests,
    testResults: testResults
  });
};

JasmineReporter.prototype.getResults = function() {
  return this._resultsDeferred.promise;
};

JasmineReporter.prototype.log = function(str) {
  console.log('logging: ', str);
};

JasmineReporter.prototype._extractSuiteResults =
function (container, ancestorTitles, suite) {
  ancestorTitles = ancestorTitles.concat([suite.description]);

  suite.specs().forEach(
    this._extractSpecResults.bind(this, container, ancestorTitles)
  );
  suite.suites().forEach(
    this._extractSuiteResults.bind(this, container, ancestorTitles)
  );
};

JasmineReporter.prototype._extractSpecResults =
function (container, ancestorTitles, spec) {
  var results = {
    title: 'it ' + spec.description,
    ancestorTitles: ancestorTitles,
    failureMessages: [],
    logMessages: [],
    numPassingAsserts: 0
  };

  spec.results().getItems().forEach(function(result) {
    switch (result.type) {
      case 'log':
        results.logMessages.push(result.toString());
        break;
      case 'expect':
        if (result.passed()) {
          results.numPassingAsserts++;

        // Exception thrown
        } else if (!result.matcherName && result.trace.stack) {
          // jasmine doesn't give us access to the actual Error object, so we
          // have to regexp out the message from the stack string in order to
          // colorize the `message` value
          result.trace.stack = result.trace.stack.replace(
            /(^.*$(?=\n\s*at))/m,
            this._formatMsg('$1', ERROR_TITLE_COLOR)
          );

          results.failureMessages.push(result.trace.stack);
        } else {
          var message;
          if (DIFFABLE_MATCHERS[result.matcherName]) {
            var ppActual = this._prettyPrint(result.actual);
            var ppExpected = this._prettyPrint(result.expected);
            var colorDiff = this._highlightDifferences(ppActual, ppExpected);

            var matcherName = (result.isNot ? 'NOT ' : '') + result.matcherName;

            message =
              this._formatMsg('Expected:', ERROR_TITLE_COLOR) +
                ' ' + colorDiff.a +
                ' ' + this._formatMsg(matcherName + ':', ERROR_TITLE_COLOR) +
                ' ' + colorDiff.b;
          } else {
            message = this._formatMsg(result.message, ERROR_TITLE_COLOR);
          }

          if (result.trace.stack) {
            // Replace the error message with a colorized version of the error
            message = result.trace.stack.replace(result.trace.message, message);

            // Remove the 'Error: ' prefix from the stack trace
            message = message.replace(/^.*Error:\s*/, '');

            // Remove jasmine jonx from the stack trace
            message = message.split('\n').filter(function(line) {
              return !/vendor\/jasmine\//.test(line);
            }).join('\n');
          }

          results.failureMessages.push(message);
        }
        break;
      default:
        throw new Error(
          'Unexpected jasmine spec result type: ', result.type
        );
    }
  }, this);

  container.push(results);
};

JasmineReporter.prototype._highlightDifferences = function (a, b) {
  var differ;
  if (a.match(LINEBREAK_REGEX) || b.match(LINEBREAK_REGEX)) {
    // `diff` uses the Myers LCS diff algorithm which runs in O(n+d^2) time
    // (where "d" is the edit distance) and can get very slow for large edit
    // distances. Mitigate the cost by switching to a lower-resolution diff
    // whenever linebreaks are involved.
    differ = diff.diffLines;
  } else {
    differ = diff.diffChars;
  }
  var changes = differ(a, b);
  var ret = {a: '', b: ''};
  var change;
  for (var i = 0, il = changes.length; i < il; i++) {
    change = changes[i];
    if (change.added) {
      ret.b += this._formatMsg(change.value, colors.RED_BG);
    } else if (change.removed) {
      ret.a += this._formatMsg(change.value, colors.RED_BG);
    } else {
      ret.a += change.value;
      ret.b += change.value;
    }
  }
  return ret;
};

JasmineReporter.prototype._prettyPrint = function(obj, indent, cycleWeakMap) {
  if (!indent) {
    indent = '';
  }

  if (typeof obj === 'object' && obj !== null) {
    if (jasmine.isDomNode(obj)) {
      var attrStr = '';
      Array.prototype.forEach.call(obj.attributes, function(attr) {
        var attrName = attr.nodeName.trim();
        var attrValue = attr.nodeValue.trim();
        attrStr += ' ' + attrName + '="' + attrValue + '"';
      });
      return 'HTMLNode(' +
        '<' + obj.tagName + attrStr + '>[...]</' + obj.tagName + '>' +
      ')';
    }

    /* jshint camelcase:false */
    if (!cycleWeakMap) {
      if (typeof WeakMap !== 'function') {
        throw new Error(
          'Please run node with the --harmony flag! jest requires WeakMap ' +
          'which is only available with the --harmony flag in node < v0.12'
        );
      }
      cycleWeakMap = new WeakMap();
    }

    if (cycleWeakMap.get(obj) === true) {
      return '<circular reference>';
    }
    cycleWeakMap.set(obj, true);

    var orderedKeys = Object.keys(obj).sort();
    var value;
    var keysOutput = [];
    var keyIndent = this._formatMsg('|', colors.GRAY) + ' ';
    for (var i = 0; i < orderedKeys.length; i++) {
      if (orderedKeys[i] === '__jstest_pp_cycle__') {
        continue;
      }
      value = obj[orderedKeys[i]];
      keysOutput.push(
        indent + keyIndent + orderedKeys[i] + ': ' +
        this._prettyPrint(value, indent + keyIndent, cycleWeakMap)
      );
    }
    delete obj.__jstest_pp_cycle__;
    return '{\n' + keysOutput.join(',\n') + '\n' + indent + '}';
  } else {
    return jasmine.pp(obj);
  }
};

JasmineReporter.prototype._formatMsg = function(msg, color) {
  return formatMsg(msg, color, this._config);
};

module.exports = JasmineReporter;
