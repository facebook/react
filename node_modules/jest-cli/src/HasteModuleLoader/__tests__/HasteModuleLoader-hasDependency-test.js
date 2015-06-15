/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

describe('nodeHasteModuleLoader', function() {
  var HasteModuleLoader;
  var mockEnvironment;
  var resources;
  var mockConfig = {
    coverageCollector: '../IstanbulCollector'
  };

  var mockResourceMap = {
    getResource: function(type, name) {
      if (!resources.hasOwnProperty(name)) {
        return undefined;
      }
      return resources[name];
    }
  };

  function _generateResource(name, deps) {
    deps = deps || [];
    var resource = {
      path: '/path/to/' + name + '.js',
      id: name,
      _requiredModuleMap: deps.reduce(function(prev, next) {
        return prev[next] = true;
      }, {})
    };
    if (deps.length) {
      resource.requiredModules = deps;
    }
    return resource;
  }

  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');

    mockEnvironment = {
      global: {
        console: {},
        mockClearTimers: jest.genMockFn()
      },
      runSourceText: jest.genMockFn().mockImplementation(function(codeStr) {
        /* jshint evil: true */
        return (new Function('return ' + codeStr))();
      })
    };
    resources = {};
  });

  describe('hasDependency', function() {
    it('properly calculates direct 1-way dependencies', function() {
      resources.ModuleA = _generateResource('ModuleA', ['ModuleB']);
      resources.ModuleB = _generateResource('ModuleB');

      var loader = new HasteModuleLoader(mockConfig,
        mockEnvironment, mockResourceMap);
      var mockModules = loader.requireModule(__filename, 'mock-modules');
      expect(mockModules.hasDependency('ModuleA', 'ModuleB')).toBe(true);
      expect(mockModules.hasDependency('ModuleB', 'ModuleA')).toBe(false);
    });

    it('properly calculates direct cyclic dependencies', function() {
      resources.ModuleA = _generateResource('ModuleA', ['ModuleB']);
      resources.ModuleB = _generateResource('ModuleB', ['ModuleA']);

      var loader = new HasteModuleLoader(mockConfig,
        mockEnvironment, mockResourceMap);
      var mockModules = loader.requireModule(__filename, 'mock-modules');
      expect(mockModules.hasDependency('ModuleA', 'ModuleB')).toBe(true);
      expect(mockModules.hasDependency('ModuleB', 'ModuleA')).toBe(true);
    });

    it('properly calculates indirect 1-way dependencies', function() {
      resources.ModuleA = _generateResource('ModuleA', ['ModuleB']);
      resources.ModuleB = _generateResource('ModuleB', ['ModuleC']);
      resources.ModuleC = _generateResource('ModuleC');

      var loader = new HasteModuleLoader(mockConfig,
        mockEnvironment, mockResourceMap);
      var mockModules = loader.requireModule(__filename, 'mock-modules');
      expect(mockModules.hasDependency('ModuleA', 'ModuleC')).toBe(true);
    });

    it('properly calculates indirect cyclic dependencies', function() {
      resources.ModuleA = _generateResource('ModuleA', ['ModuleB']);
      resources.ModuleB = _generateResource('ModuleB', ['ModuleC']);
      resources.ModuleC = _generateResource('ModuleC', ['ModuleA']);

      var loader = new HasteModuleLoader(mockConfig,
        mockEnvironment, mockResourceMap);
      var mockModules = loader.requireModule(__filename, 'mock-modules');
      expect(mockModules.hasDependency('ModuleA', 'ModuleC')).toBe(true);
      expect(mockModules.hasDependency('ModuleC', 'ModuleA')).toBe(true);
    });
  });
});
