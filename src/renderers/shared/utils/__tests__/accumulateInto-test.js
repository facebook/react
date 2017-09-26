/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var accumulateInto;

describe('accumulateInto', () => {
  beforeEach(() => {
    accumulateInto = require('accumulateInto');
  });

  it('throws if the second item is null', () => {
    expect(function() {
      accumulateInto([], null);
    }).toThrowError(
      'accumulateInto(...): Accumulated items must not be null or undefined.',
    );
  });

  it('returns the second item if first is null', () => {
    var a = [];
    expect(accumulateInto(null, a)).toBe(a);
  });

  it('merges the second into the first if first item is an array', () => {
    var a = [1, 2];
    var b = [3, 4];
    accumulateInto(a, b);
    expect(a).toEqual([1, 2, 3, 4]);
    expect(b).toEqual([3, 4]);
    var c = [1];
    accumulateInto(c, 2);
    expect(c).toEqual([1, 2]);
  });

  it('returns a new array if first or both items are scalar', () => {
    var a = [2];
    expect(accumulateInto(1, a)).toEqual([1, 2]);
    expect(a).toEqual([2]);
    expect(accumulateInto(1, 2)).toEqual([1, 2]);
  });
});
