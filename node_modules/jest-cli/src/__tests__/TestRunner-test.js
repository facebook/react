/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff().mock('fs');

var q = require('q');

describe('TestRunner', function() {
  var TestRunner;

  beforeEach(function() {
    TestRunner = require('../TestRunner');
  });

  describe('_isTestFilePath', function() {
    var runner;
    var utils;

    beforeEach(function() {
      utils = require('../lib/utils');
      runner = new TestRunner(utils.normalizeConfig({
        rootDir: '.',
        testPathDirs: []
      }));
    });

    it('supports ../ paths and unix separators', function() {
      var path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
      var isTestFile = runner._isTestFilePath(path);

      return expect(isTestFile).toEqual(true);
    });

    it('supports ../ paths and windows separators', function() {
      var path = 'c:\\path\\to\\__tests__\\foo\\bar\\baz\\..\\..\\..\\test.js';
      var isTestFile = runner._isTestFilePath(path);

      return expect(isTestFile).toEqual(true);
    });

    it('supports unix separators', function() {
      var path = '/path/to/__tests__/test.js';
      var isTestFile = runner._isTestFilePath(path);

      return expect(isTestFile).toEqual(true);
    });

    it('supports windows separators', function() {
      var path = 'c:\\path\\to\\__tests__\\test.js';
      var isTestFile = runner._isTestFilePath(path);

      return expect(isTestFile).toEqual(true);
    });
  });

  describe('streamTestPathsRelatedTo', function() {
    var fakeDepsFromPath;
    var fs;
    var runner;
    var utils;

    function pathStreamToPromise(pathStream) {
      var deferred = q.defer();

      var paths = [];
      pathStream.on('data', function(pathStr) {
        paths.push(pathStr);
      });

      pathStream.on('error', function(err) {
        deferred.reject(err);
      });

      pathStream.on('end', function() {
        deferred.resolve(paths);
      });

      return deferred.promise;
    }

    beforeEach(function() {
      fs = require('graceful-fs');
      utils = require('../lib/utils');
      runner = new TestRunner(utils.normalizeConfig({
        rootDir: '.',
        testPathDirs: []
      }));

      fakeDepsFromPath = {};
      runner._constructModuleLoader = function() {
        return q({
          getDependentsFromPath: function(modulePath) {
            return fakeDepsFromPath[modulePath] || [];
          }
        });
      };
    });

    pit('finds no tests when no tests depend on the path', function() {
      var path = '/path/to/module/not/covered/by/any/tests.js';
      fakeDepsFromPath[path] = [];

      // Mock out existsSync to return true, since our test path isn't real
      fs.existsSync = function() { return true; };

      return pathStreamToPromise(runner.streamTestPathsRelatedTo([path]))
        .then(function(relatedTests) {
          expect(relatedTests).toEqual([]);
        });
    });

    pit('finds tests that depend directly on the path', function() {
      var path = '/path/to/module/covered/by/one/test.js';
      var dependentTestPath = '/path/to/test/__tests__/asdf-test.js';
      fakeDepsFromPath[path] = [dependentTestPath];

      // Mock out existsSync to return true, since our test path isn't real
      fs.existsSync = function() { return true; };

      return pathStreamToPromise(runner.streamTestPathsRelatedTo([path]))
        .then(function(relatedTests) {
          expect(relatedTests).toEqual([dependentTestPath]);
        });
    });

    pit('finds tests that depend indirectly on the path', function() {
      var path = '/path/to/module/covered/by/module/covered/by/test.js';
      var dependentModulePath = '/path/to/dependent/module.js';
      var dependentTestPath = '/path/to/test/__tests__/asdf-test.js';
      fakeDepsFromPath[path] = [dependentModulePath];
      fakeDepsFromPath[dependentModulePath] = [dependentTestPath];

      // Mock out existsSync to return true, since our test path isn't real
      fs.existsSync = function() { return true; };

      return pathStreamToPromise(runner.streamTestPathsRelatedTo([path]))
        .then(function(relatedTests) {
          expect(relatedTests).toEqual([dependentTestPath]);
        });
    });

    pit('finds multiple tests that depend indirectly on the path', function() {
      var path = '/path/to/module/covered/by/modules/covered/by/test.js';
      var dependentModulePath1 = '/path/to/dependent/module1.js';
      var dependentModulePath2 = '/path/to/dependent/module2.js';
      var dependentTestPath1 = '/path/to/test1/__tests__/asdf1-test.js';
      var dependentTestPath2 = '/path/to/test2/__tests__/asdf2-test.js';
      fakeDepsFromPath[path] = [dependentModulePath1, dependentModulePath2];
      fakeDepsFromPath[dependentModulePath1] = [dependentTestPath1];
      fakeDepsFromPath[dependentModulePath2] = [dependentTestPath2];

      // Mock out existsSync to return true, since our test path isn't real
      fs.existsSync = function() { return true; };

      return pathStreamToPromise(runner.streamTestPathsRelatedTo([path]))
        .then(function(relatedTests) {
          expect(relatedTests).toEqual([
            dependentTestPath1,
            dependentTestPath2
          ]);
        });
    });

    pit('flattens circular dependencies', function() {
      var path = '/path/to/module/covered/by/modules/covered/by/test.js';
      var directDependentModulePath = '/path/to/direct/dependent/module.js';
      var indirectDependentModulePath = '/path/to/indirect/dependent/module.js';
      var dependentTestPath = '/path/to/test/__tests__/asdf-test.js';
      fakeDepsFromPath[path] = [directDependentModulePath];
      fakeDepsFromPath[directDependentModulePath] =
        [indirectDependentModulePath];
      fakeDepsFromPath[indirectDependentModulePath] = [
        directDependentModulePath,
        dependentTestPath
      ];

      // Mock out existsSync to return true, since our test path isn't real
      fs.existsSync = function() { return true; };

      return pathStreamToPromise(runner.streamTestPathsRelatedTo([path]))
        .then(function(relatedTests) {
          expect(relatedTests).toEqual([dependentTestPath]);
        });
    });

    pit('filters test paths that don\'t exist on the filesystem', function() {
      var path = '/path/to/module/covered/by/one/test.js';
      var existingTestPath = '/path/to/test/__tests__/exists-test.js';
      var nonExistantTestPath = '/path/to/test/__tests__/doesnt-exist-test.js';
      fakeDepsFromPath[path] = [existingTestPath, nonExistantTestPath];

      // Mock out existsSync to return true, since our test path isn't real
      fs.existsSync = function(path) {
        return path !== nonExistantTestPath;
      };

      return pathStreamToPromise(runner.streamTestPathsRelatedTo([path]))
        .then(function(relatedTests) {
          expect(relatedTests).toEqual([existingTestPath]);
        });
    });
  });
});
