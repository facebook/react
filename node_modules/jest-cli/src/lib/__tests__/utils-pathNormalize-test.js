/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

describe('utils-pathNormalize', function() {
  var utils;

  beforeEach(function() {
    utils = require('../utils');
  });

  it('supports ../ paths and unix separators', function() {
    var path = '/path/to/__tests__/foo/bar/baz/../../../test.js';
    var pathNormalized = utils.pathNormalize(path);

    return expect(pathNormalized).toEqual('/path/to/__tests__/test.js');
  });

  it('supports ../ paths and windows separators', function() {
    var path = 'c:\\path\\to\\__tests__\\foo\\bar\\baz\\..\\..\\..\\test.js';
    var pathNormalized = utils.pathNormalize(path);

    return expect(pathNormalized).toEqual('c:/path/to/__tests__/test.js');
  });

  it('supports unix separators', function() {
    var path = '/path/to/__tests__/test.js';
    var pathNormalized = utils.pathNormalize(path);

    return expect(pathNormalized).toEqual(path);
  });

  it('supports windows separators', function() {
    var path = 'c:\\path\\to\\__tests__\\test.js';
    var pathNormalized = utils.pathNormalize(path);

    return expect(pathNormalized).toEqual('c:/path/to/__tests__/test.js');
  });
});
