/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

// sanity tests for act()

let React;
let ReactNoop;
let act;
let DiscreteEventPriority;

describe('isomorphic act()', () => {
  beforeEach(() => {
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    DiscreteEventPriority = require('react-reconciler/constants')
      .DiscreteEventPriority;
    act = React.unstable_act;
  });

  // @gate __DEV__
  test('bypasses queueMicrotask', async () => {
    const root = ReactNoop.createRoot();

    // First test what happens without wrapping in act. This update would
    // normally be queued in a microtask.
    ReactNoop.unstable_runWithPriority(DiscreteEventPriority, () => {
      root.render('A');
    });
    // Nothing has rendered yet
    expect(root).toMatchRenderedOutput(null);
    // Flush the microtasks by awaiting
    await null;
    expect(root).toMatchRenderedOutput('A');

    // Now do the same thing but wrap the update with `act`. No
    // `await` necessary.
    act(() => {
      ReactNoop.unstable_runWithPriority(DiscreteEventPriority, () => {
        root.render('B');
      });
    });
    expect(root).toMatchRenderedOutput('B');
  });
});
