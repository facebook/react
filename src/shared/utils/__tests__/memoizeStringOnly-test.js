/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('memoizeStringOnly', function() {
  var memoizeStringOnly;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    memoizeStringOnly = require('memoizeStringOnly');
  });

  it('should be transparent to callers', function() {
    var callback = function(string) {
      return string;
    };
    var memoized = memoizeStringOnly(callback);

    expect(memoized('foo'), callback('foo'));
  });
});
