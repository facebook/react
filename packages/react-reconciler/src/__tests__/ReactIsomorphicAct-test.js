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

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  // @gate __DEV__
  test('bypasses queueMicrotask', async () => {
    const root = ReactNoop.createRoot();

    // First test what happens without wrapping in act. This update would
    // normally be queued in a microtask.
    global.IS_REACT_ACT_ENVIRONMENT = false;
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
    global.IS_REACT_ACT_ENVIRONMENT = true;
    act(() => {
      ReactNoop.unstable_runWithPriority(DiscreteEventPriority, () => {
        root.render('B');
      });
    });
    expect(root).toMatchRenderedOutput('B');
  });

  // @gate __DEV__
  test('return value – sync callback', async () => {
    expect(await act(() => 'hi')).toEqual('hi');
  });

  // @gate __DEV__
  test('return value – sync callback, nested', async () => {
    const returnValue = await act(() => {
      return act(() => 'hi');
    });
    expect(returnValue).toEqual('hi');
  });

  // @gate __DEV__
  test('return value – async callback', async () => {
    const returnValue = await act(async () => {
      return await Promise.resolve('hi');
    });
    expect(returnValue).toEqual('hi');
  });

  // @gate __DEV__
  test('return value – async callback, nested', async () => {
    const returnValue = await act(async () => {
      return await act(async () => {
        return await Promise.resolve('hi');
      });
    });
    expect(returnValue).toEqual('hi');
  });

  // @gate __DEV__
  test('in legacy mode, updates are batched', () => {
    const root = ReactNoop.createLegacyRoot();

    // Outside of `act`, legacy updates are flushed completely synchronously
    root.render('A');
    expect(root).toMatchRenderedOutput('A');

    // `act` will batch the updates and flush them at the end
    act(() => {
      root.render('B');
      // Hasn't flushed yet
      expect(root).toMatchRenderedOutput('A');

      // Confirm that a nested `batchedUpdates` call won't cause the updates
      // to flush early.
      ReactNoop.batchedUpdates(() => {
        root.render('C');
      });

      // Still hasn't flushed
      expect(root).toMatchRenderedOutput('A');
    });

    // Now everything renders in a single batch.
    expect(root).toMatchRenderedOutput('C');
  });

  // @gate __DEV__
  test('in legacy mode, in an async scope, updates are batched until the first `await`', async () => {
    const root = ReactNoop.createLegacyRoot();

    await act(async () => {
      // These updates are batched. This replicates the behavior of the original
      // `act` implementation, for compatibility.
      root.render('A');
      root.render('B');
      // Nothing has rendered yet.
      expect(root).toMatchRenderedOutput(null);
      await null;
      // Updates are flushed after the first await.
      expect(root).toMatchRenderedOutput('B');

      // Subsequent updates in the same scope aren't batched.
      root.render('C');
      expect(root).toMatchRenderedOutput('C');
    });
  });
});
