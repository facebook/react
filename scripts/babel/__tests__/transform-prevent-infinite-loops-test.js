/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('transform-prevent-infinite-loops', () => {
  // Note: instead of testing the transform by applying it,
  // we assume that it *is* already applied. Since we expect
  // it to be applied to all our tests.

  it('fails the test for `while` loops', () => {
    expect(global.infiniteLoopError).toBe(null);
    expect(() => {
      while (true) {
        // do nothing
      }
    }).toThrow(RangeError);
    // Make sure this gets set so the test would fail regardless.
    expect(global.infiniteLoopError).not.toBe(null);
    // Clear the flag since otherwise *this* test would fail.
    global.infiniteLoopError = null;
  });

  it('fails the test for `for` loops', () => {
    expect(global.infiniteLoopError).toBe(null);
    expect(() => {
      for (;;) {
        // do nothing
      }
    }).toThrow(RangeError);
    // Make sure this gets set so the test would fail regardless.
    expect(global.infiniteLoopError).not.toBe(null);
    // Clear the flag since otherwise *this* test would fail.
    global.infiniteLoopError = null;
  });
});
