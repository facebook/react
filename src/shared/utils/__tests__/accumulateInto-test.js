/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

require('mock-modules')
  .dontMock('accumulateInto');

var accumulateInto;

describe('accumulateInto', function() {

  beforeEach(function() {
    accumulateInto = require('accumulateInto');
  });

  it('throws if the second item is null', function() {
    expect(function() {
      accumulateInto([], null);
    }).toThrow(
      'Invariant Violation: accumulateInto(...): Accumulated items must not ' +
      'be null or undefined.'
    );
  });

  it('returns the second item if first is null', function() {
    var a = [];
    expect(accumulateInto(null, a)).toBe(a);
  });

  it('merges the second into the first if first item is an array', function() {
    var a = [1, 2];
    var b = [3, 4];
    accumulateInto(a, b);
    expect(a).toEqual([1, 2, 3, 4]);
    expect(b).toEqual([3, 4]);
    var c = [1];
    accumulateInto(c, 2);
    expect(c).toEqual([1, 2]);
  });

  it('returns a new array if first or both items are scalar', function() {
    var a = [2];
    expect(accumulateInto(1, a)).toEqual([1, 2]);
    expect(a).toEqual([2]);
    expect(accumulateInto(1, 2)).toEqual([1, 2]);
  });
});
