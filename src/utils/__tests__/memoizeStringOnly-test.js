/**
 * @emails react-core
 */

"use strict";

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
