/**
 * Copyright (c) 2015, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('mock-modules').autoMockOff();

describe('JasmineReporter', function() {
  // modules
  var JasmineReporter;
  var colors;

  // other variables
  var reporter;

  beforeEach(function() {
    JasmineReporter = require('../JasmineReporter');
    colors = require('../../lib/colors');

    reporter = new JasmineReporter();
  });

  describe('colorization', function() {
    function getRunner(actualResult, expectedResult, passed) {
      return {
        suites: function() {
          return [
            {
              parentSuite: null,
              specs: function() {
                return [
                  {
                    results: function() {
                      return {
                        getItems: function() {
                          return [
                            {
                              actual: actualResult,
                              expected: expectedResult,
                              matcherName: 'toBe',
                              passed: function() { return passed; },
                              trace: {},
                              type: 'expect',
                            }
                          ];
                        },
                      };
                    },
                  },
                ];
              },
              suites: function() { return []; },
            },
          ];
        },
      };
    }

    function errorize(str) {
      return colors.RED + colors.BOLD + colors.UNDERLINE + str + colors.RESET;
    }

    function highlight(str) {
      return colors.RED_BG + str + colors.RESET;
    }

    pit('colorizes single-line failures using a per-char diff', function() {
      var runner = getRunner('foo', 'foobar', false);
      reporter.reportRunnerResults(runner);

      return reporter.getResults().then(function(result) {
        var message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\' ' +
          errorize('toBe:') + ' \'foo' + highlight('bar') + '\''
        );
      });
    });

    pit('colorizes multi-line failures using a per-line diff', function() {
      var runner = getRunner('foo\nbar\nbaz', 'foo\nxxx\nbaz', false);
      reporter.reportRunnerResults(runner);

      return reporter.getResults().then(function(result) {
        var message = result.testResults[0].failureMessages[0];
        expect(message).toBe(
          errorize('Expected:') + ' \'foo\n' + highlight('bar\n') + 'baz\' ' +
          errorize('toBe:') + ' \'foo\n' + highlight('xxx\n') + 'baz\''
        );
      });
    });
  });
});
