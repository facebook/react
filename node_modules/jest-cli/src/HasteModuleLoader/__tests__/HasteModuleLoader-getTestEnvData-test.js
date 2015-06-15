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

  var config;
  beforeEach(function() {
    HasteModuleLoader = require('../HasteModuleLoader');
    config = utils.normalizeConfig({
      name: 'HasteModuleLoader-tests',
      rootDir: path.resolve(__dirname, 'test_root'),
      testEnvData: {someTestData: 42},
    });
  });

  function buildLoader() {
    if (!resourceMap) {
      return HasteModuleLoader.loadResourceMap(config).then(function(map) {
        resourceMap = map;
        return buildLoader();
      });
    } else {
      return q(new HasteModuleLoader(config, mockEnvironment, resourceMap));
    }
  }

  pit('passes config data through to jest.envData', function() {
    return buildLoader().then(function(loader) {
      var envData = loader.requireModule(null, 'jest-runtime').getTestEnvData();
      expect(envData).toEqual(config.testEnvData);
    });
  });

  pit('freezes jest.envData object', function() {
    return buildLoader().then(function(loader) {
      var envData = loader.requireModule(null, 'jest-runtime').getTestEnvData();
      expect(Object.isFrozen(envData)).toBe(true);
    });
  });
});
