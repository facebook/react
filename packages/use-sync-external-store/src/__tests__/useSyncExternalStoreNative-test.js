/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 *
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;
let Scheduler;
let useSyncExternalStoreNative;
let act;

// This tests the userspace shim of `useSyncExternalStore` in a server-rendering
// (Node) environment
describe('useSyncExternalStore (userspace shim, server rendering)', () => {
  beforeEach(() => {
    jest.resetModules();

    // Remove useSyncExternalStore from the React imports so that we use the
    // shim instead. Also removing startTransition, since we use that to detect
    // outdated 18 alphas that don't yet include useSyncExternalStore.
    //
    // Longer term, we'll probably test this branch using an actual build of
    // React 17.
    jest.mock('react', () => {
      const {
        // eslint-disable-next-line no-unused-vars
        startTransition: _,
        // eslint-disable-next-line no-unused-vars
        useSyncExternalStore: __,
        // eslint-disable-next-line no-unused-vars
        unstable_useSyncExternalStore: ___,
        ...otherExports
      } = jest.requireActual('react');
      return otherExports;
    });

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    useSyncExternalStoreNative = require('use-sync-external-store/index.native')
      .useSyncExternalStore;
  });

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function createExternalStore(initialState) {
    const listeners = new Set();
    let currentState = initialState;
    return {
      set(text) {
        currentState = text;
        ReactDOM.unstable_batchedUpdates(() => {
          listeners.forEach(listener => listener());
        });
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getState() {
        return currentState;
      },
      getSubscriberCount() {
        return listeners.size;
      },
    };
  }

  test('native version', async () => {
    const store = createExternalStore('client');

    function App() {
      const text = useSyncExternalStoreNative(
        store.subscribe,
        store.getState,
        () => 'server',
      );
      return <Text text={text} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['client']);
    expect(root).toMatchRenderedOutput('client');
  });
});
