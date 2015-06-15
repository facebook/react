/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

var path = require('path');
var TestRunner = require('../TestRunner');
var utils = require('../lib/utils');

describe('TestRunner-fs', function() {

  describe('testPathsMatching', function() {

    pit('finds tests with default file extensions', function() {
      var rootDir = path.resolve(__dirname, 'test_root');
      var runner = new TestRunner(utils.normalizeConfig({
        rootDir: rootDir,
        testDirectoryName: '__testtests__',
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        var relPaths = paths.map(function (absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths).toEqual([path.normalize('__testtests__/test.js')]);
      });
    });

    pit('finds tests with similar but custom file extensions', function() {
      var rootDir = path.resolve(__dirname, 'test_root');
      var runner = new TestRunner(utils.normalizeConfig({
        rootDir: rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['jsx'],
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        var relPaths = paths.map(function (absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths).toEqual([path.normalize('__testtests__/test.jsx')]);
      });
    });

    pit('finds tests with totally custom foobar file extensions', function() {
      var rootDir = path.resolve(__dirname, 'test_root');
      var runner = new TestRunner(utils.normalizeConfig({
        rootDir: rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['foobar'],
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        var relPaths = paths.map(function (absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths).toEqual([path.normalize('__testtests__/test.foobar')]);
      });
    });

    pit('finds tests with many kinds of file extensions', function() {
      var rootDir = path.resolve(__dirname, 'test_root');
      var runner = new TestRunner(utils.normalizeConfig({
        rootDir: rootDir,
        testDirectoryName: '__testtests__',
        testFileExtensions: ['js', 'jsx'],
      }));
      return runner.promiseTestPathsMatching(/.*/).then(function(paths) {
        var relPaths = paths.map(function (absPath) {
          return path.relative(rootDir, absPath);
        });
        expect(relPaths.sort()).toEqual([
          path.normalize('__testtests__/test.js'),
          path.normalize('__testtests__/test.jsx'),
        ]);
      });
    });

  });

});
