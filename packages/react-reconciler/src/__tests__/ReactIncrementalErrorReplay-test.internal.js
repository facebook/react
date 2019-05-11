/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

'use strict';

describe('ReactIncrementalErrorReplay-test', () => {
  it('copies all keys when stashing potentially failing work', () => {
    // Note: this test is fragile and relies on internals.
    // We almost always try to avoid such tests, but here the cost of
    // the list getting out of sync (and causing subtle bugs in rare cases)
    // is higher than the cost of maintaining the test.
    const {
      // Any Fiber factory function will do.
      createHostRootFiber,
      // This is the method we're going to test.
      // If this is no longer used, you can delete this test file.
      assignFiberPropertiesInDEV,
    } = require('../ReactFiber');

    // Get a real fiber.
    const realFiber = createHostRootFiber(false);
    const stash = assignFiberPropertiesInDEV(null, realFiber);

    // Verify we get all the same fields.
    expect(realFiber).toEqual(stash);

    // Mutate the original.
    for (let key in realFiber) {
      realFiber[key] = key + '_' + Math.random();
    }
    expect(realFiber).not.toEqual(stash);

    // Verify we can still "revert" to the stashed properties.
    expect(assignFiberPropertiesInDEV(realFiber, stash)).toBe(realFiber);
    expect(realFiber).toEqual(stash);
  });
});
