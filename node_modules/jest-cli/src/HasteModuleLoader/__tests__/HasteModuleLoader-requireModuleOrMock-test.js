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
    rootDir: path.resolve(__dirname, 'test_root')
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
        mockClearTimers: jest.genMockFn()
      },
      runSourceText: jest.genMockFn().mockImplementation(function(codeStr) {
        /* jshint evil:true */
        return (new Function('return ' + codeStr))();
      })
    };
  });

  describe('requireModuleOrMock', function() {
    pit('mocks modules by default', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.setModuleStateValue._isMockFunction).toBe(true);
      });
    });

    pit('doesnt mock modules when explicitly dontMock()ed', function() {
      return buildLoader().then(function(loader) {
        loader.requireModuleOrMock(null, 'jest-runtime')
          .dontMock('RegularModule');
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('doesnt mock modules when explicitly dontMock()ed via a different ' +
        'denormalized module name', function() {
      return buildLoader().then(function(loader) {
        loader.requireModuleOrMock(__filename, 'jest-runtime')
          .dontMock('./test_root/RegularModule');
        var exports = loader.requireModuleOrMock(__filename, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('doesnt mock modules when autoMockOff() has been called', function() {
      return buildLoader().then(function(loader) {
        loader.requireModuleOrMock(null, 'jest-runtime').autoMockOff();
        var exports = loader.requireModuleOrMock(null, 'RegularModule');
        expect(exports.isRealModule).toBe(true);
      });
    });

    pit('uses manual mock when automocking on and mock is avail', function() {
      return buildLoader().then(function(loader) {
        var exports = loader.requireModuleOrMock(null, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(true);
      });
    });

    pit('does not use manual mock when automocking is off and a real ' +
        'module is available', function() {
      return buildLoader().then(function(loader) {
        loader.requireModuleOrMock(__filename, 'jest-runtime').autoMockOff();
        var exports = loader.requireModuleOrMock(__filename, 'ManuallyMocked');
        expect(exports.isManualMockModule).toBe(false);
      });
    });
  });
});
