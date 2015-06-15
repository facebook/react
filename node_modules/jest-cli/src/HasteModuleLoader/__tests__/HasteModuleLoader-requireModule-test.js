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
var q = require('q');
var utils = require('../../lib/utils');

describe('HasteModuleLoader', function() {
  var HasteModuleLoader;
  var mockEnvironment;
  var resourceMap;

  var CONFIG = utils.normalizeConfig({
    name: 'HasteModuleLoader-tests',
    rootDir: path.join(__dirname, 'test_root')
  });

  function buildLoader() {
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(CONFIG).then(function(map) {
        resourceMap = map;
        return buildLoader();
      });
    } else {
      return q(new HasteModuleLoader(CONFIG, mockEnvironment, resourceMap));
    }
  }

  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');

    mockEnvironment = {
      global: {
        console: {},
        mockClearTimers: jest.genMockFn(),
        JSON: JSON
      },
      runSourceText: jest.genMockFn().mockImplementation(function(codeStr) {
        /* jshint evil:true */
        return (new Function('return ' + codeStr))();
      })
    };
  });

  describe('requireModule', function() {
    pit('finds @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('throws on non-existant @providesModule modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(null, 'DoesntExist');
        }).toThrow('Cannot find module \'DoesntExist\' from \'.\'');
      });
    });

    pit('finds relative-path modules without file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(
          __filename,
          './test_root/RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('finds relative-path modules with file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(
          __filename,
          './test_root/RegularModule.js'
        );
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('throws on non-existant relative-path modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(__filename, './DoesntExist');
        }).toThrow(
          'Cannot find module \'./DoesntExist\' from \'' + __filename + '\''
        );
      });
    });

    pit('finds node core built-in modules', function() {
      return buildLoader().then(function(loader) {
        expect(function() {
          loader.requireModule(null, 'fs');
        }).not.toThrow();
      });
    });

    pit('finds and loads JSON files without file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(__filename, './test_root/JSONFile');
        expect(exports.isJSONModule).toBe(true);
      });
    });

    pit('finds and loads JSON files with file extension', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModule(
          __filename,
          './test_root/JSONFile.json'
        );
        expect(exports.isJSONModule).toBe(true);
      });
    });

    pit('requires a JSON file twice successfully', function() {
      return buildLoader().then(function(loader) {
        var exports1 = loader.requireModule(
          __filename,
          './test_root/JSONFile.json'
        );
        var exports2 = loader.requireModule(
          __filename,
          './test_root/JSONFile.json'
        );
        expect(exports1.isJSONModule).toBe(true);
        expect(exports2.isJSONModule).toBe(true);
        expect(exports1).toBe(exports2);
      });
    });

    describe('features I want to remove, but must exist for now', function() {
      /**
       * I'd like to kill this and make all tests use something more explicit
       * when they want a manual mock, like:
       *
       *   require.mock('MyManualMock');
       *   var ManuallyMocked = require('ManuallyMocked');
       *
       *   --or--
       *
       *   var ManuallyMocked = require.manualMock('ManuallyMocked');
       *
       * For now, however, this is built-in and many tests rely on it, so we
       * must support it until we can do some cleanup.
       */
      pit('provides manual mock when real module doesnt exist', function() {
        return buildLoader().then(function(loader) {
          var exports = loader.requireModule(
            __filename,
            'ExclusivelyManualMock'
          );
          expect(exports.isExclusivelyManualMockModule).toBe(true);
        });
      });

      /**
       * requireModule() should *always* return the real module. Mocks should
       * only be returned by requireMock().
       *
       * See the 'overrides real modules with manual mock when one exists' test
       * for more info on why I want to kill this feature.
       */
      pit('doesnt override real modules with manual mocks when explicitly ' +
          'marked with .dontMock()', function() {
        return buildLoader().then(function(loader) {
          loader.requireModule(__filename, 'jest-runtime')
            .dontMock('ManuallyMocked');

          var exports = loader.requireModule(__filename, 'ManuallyMocked');
          expect(exports.isManualMockModule).toBe(false);
        });
      });

      /**
       * This test is only in this section because it seems sketchy to be able
       * to load up a module without pulling it from the registry. I need to do
       * more investigation to understand the reasoning behind this before I
       * declare it unnecessary and condemn it.
       */
      pit('doesnt read from the module registry when bypassModuleRegistry is ' +
          'set', function() {
        return buildLoader().then(function(loader) {
          var registryExports = loader.requireModule(
            __filename,
            'RegularModule'
          );
          registryExports.setModuleStateValue('registry');

          var bypassedExports = loader.requireModule(
            __filename,
            'RegularModule',
            true
          );
          expect(bypassedExports.getModuleStateValue()).not.toBe('registry');
        });
      });

      pit('doesnt write to the module registry when bypassModuleRegistry is ' +
          'set', function() {
        return buildLoader().then(function(loader) {
          var registryExports = loader.requireModule(
            __filename,
            'RegularModule'
          );
          registryExports.setModuleStateValue('registry');

          var bypassedExports = loader.requireModule(
            __filename,
            'RegularModule',
            true
          );
          bypassedExports.setModuleStateValue('bypassed');

          expect(registryExports.getModuleStateValue()).toBe('registry');
        });
      });
    });
  });
});
