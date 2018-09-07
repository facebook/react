/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let accumulateInto;

describe('accumulateInto', () => {
  beforeEach(() => {
    accumulateInto = require('events/accumulateInto').default;
  });

  it('throws if the second item is null', () => {
    expect(function() {
      accumulateInto([], null);
    }).toThrowError(
      'accumulateInto(...): Accumulated items must not be null or undefined.',
    );
  });

  it('returns the second item if first is null', () => {
    const a = [];
    expect(accumulateInto(null, a)).toBe(a);
  });

  it('merges the second into the first if first item is an array', () => {
    const a = [1, 2];
    const b = [3, 4];
    accumulateInto(a, b);
    expect(a).toEqual([1, 2, 3, 4]);
    expect(b).toEqual([3, 4]);
    const c = [1];
    accumulateInto(c, 2);
    expect(c).toEqual([1, 2]);
  });

  it('returns a new array if first or both items are scalar', () => {
    const a = [2];
    expect(accumulateInto(1, a)).toEqual([1, 2]);
    expect(a).toEqual([2]);
    expect(accumulateInto(1, 2)).toEqual([1, 2]);
  });
});
