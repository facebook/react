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
let useSyncExternalStore;
let useSyncExternalStoreExtra;
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

    jest.mock('use-sync-external-store', () =>
      jest.requireActual('use-sync-external-store/index.native'),
    );

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    useSyncExternalStore = require('use-sync-external-store')
      .useSyncExternalStore;
    useSyncExternalStoreExtra = require('use-sync-external-store/extra')
      .useSyncExternalStoreExtra;
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
        ReactNoop.batchedUpdates(() => {
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
      const text = useSyncExternalStore(
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

  test('native version', async () => {
    const store = createExternalStore('client');

    function App() {
      const text = useSyncExternalStore(
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

  // @gate !(enableUseRefAccessWarning && __DEV__)
  test('Using isEqual to bailout', async () => {
    const store = createExternalStore({a: 0, b: 0});

    function A() {
      const {a} = useSyncExternalStoreExtra(
        store.subscribe,
        store.getState,
        null,
        state => ({a: state.a}),
        (state1, state2) => state1.a === state2.a,
      );
      return <Text text={'A' + a} />;
    }
    function B() {
      const {b} = useSyncExternalStoreExtra(
        store.subscribe,
        store.getState,
        null,
        state => {
          return {b: state.b};
        },
        (state1, state2) => state1.b === state2.b,
      );
      return <Text text={'B' + b} />;
    }

    function App() {
      return (
        <>
          <A />
          <B />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    act(() => root.render(<App />));

    expect(Scheduler).toHaveYielded(['A0', 'B0']);
    expect(root).toMatchRenderedOutput('A0B0');

    // Update b but not a
    await act(() => {
      store.set({a: 0, b: 1});
    });
    // Only b re-renders
    expect(Scheduler).toHaveYielded(['B1']);
    expect(root).toMatchRenderedOutput('A0B1');

    // Update a but not b
    await act(() => {
      store.set({a: 1, b: 1});
    });
    // Only a re-renders
    expect(Scheduler).toHaveYielded(['A1']);
    expect(root).toMatchRenderedOutput('A1B1');
  });
});
