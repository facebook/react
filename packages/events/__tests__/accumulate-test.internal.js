/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let accumulate;

describe('accumulate', () => {
  beforeEach(() => {
    accumulate = require('events/accumulate').default;
  });

  it('throws if the second item is null', () => {
    expect(function() {
      accumulate([], null);
    }).toThrowError(
      'accumulate(...): Accumulated items must not be null or undefined.',
    );
  });

  it('return second item if first item is null', () => {
    const a = [];
    expect(accumulate(null, a)).toBe(a);
  });

  it('return concatenation of items if first item is an array', () => {
    const a = ['hello'];
    const b = 'world';
    expect(accumulate(a, b)).toEqual(['hello', 'world']);
  });

  it('return concatenation of items if second item is an array', () => {
    const a = 'hello';
    const b = ['world'];
    expect(accumulate(a, b)).toEqual(['hello', 'world']);
  });

  it('return an array containing both items if neither item is an array', () => {
    const a = 'hello';
    const b = 'world';
    expect(accumulate(a, b)).toEqual(['hello', 'world']);
  });
});
