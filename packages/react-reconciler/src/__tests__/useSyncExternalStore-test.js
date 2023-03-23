/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let useSyncExternalStore;
let React;
let ReactNoop;
let Scheduler;
let act;
let useLayoutEffect;
let forwardRef;
let useImperativeHandle;
let useRef;
let useState;
let startTransition;
let waitFor;
let waitForAll;
let assertLog;

// This tests the native useSyncExternalStore implementation, not the shim.
// Tests that apply to both the native implementation and the shim should go
// into useSyncExternalStoreShared-test.js. The reason they are separate is
// because at some point we may start running the shared tests against vendored
// React DOM versions (16, 17, etc) instead of React Noop.
describe('useSyncExternalStore', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useLayoutEffect = React.useLayoutEffect;
    useImperativeHandle = React.useImperativeHandle;
    forwardRef = React.forwardRef;
    useRef = React.useRef;
    useState = React.useState;
    useSyncExternalStore = React.useSyncExternalStore;
    startTransition = React.startTransition;

    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    waitForAll = InternalTestUtils.waitForAll;
    assertLog = InternalTestUtils.assertLog;

    act = require('internal-test-utils').act;
  });

  function Text({text}) {
    Scheduler.log(text);
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

  test(
    'detects interleaved mutations during a concurrent read before ' +
      'layout effects fire',
    async () => {
      const store1 = createExternalStore(0);
      const store2 = createExternalStore(0);

      const Child = forwardRef(({store, label}, ref) => {
        const value = useSyncExternalStore(store.subscribe, store.getState);
        useImperativeHandle(
          ref,
          () => {
            return value;
          },
          [],
        );
        return <Text text={label + value} />;
      });

      function App({store}) {
        const refA = useRef(null);
        const refB = useRef(null);
        const refC = useRef(null);
        useLayoutEffect(() => {
          // This layout effect reads children that depend on an external store.
          // This demostrates whether the children are consistent when the
          // layout phase runs.
          const aText = refA.current;
          const bText = refB.current;
          const cText = refC.current;
          Scheduler.log(
            `Children observed during layout: A${aText}B${bText}C${cText}`,
          );
        });
        return (
          <>
            <Child store={store} ref={refA} label="A" />
            <Child store={store} ref={refB} label="B" />
            <Child store={store} ref={refC} label="C" />
          </>
        );
      }

      const root = ReactNoop.createRoot();
      await act(async () => {
        // Start a concurrent render that reads from the store, then yield.
        startTransition(() => {
          root.render(<App store={store1} />);
        });

        await waitFor(['A0', 'B0']);

        // During an interleaved event, the store is mutated.
        store1.set(1);

        // Then we continue rendering.
        await waitForAll([
          // C reads a newer value from the store than A or B, which means they
          // are inconsistent.
          'C1',

          // Before committing the layout effects, React detects that the store
          // has been mutated. So it throws out the entire completed tree and
          // re-renders the new values.
          'A1',
          'B1',
          'C1',
          // The layout effects reads consistent children.
          'Children observed during layout: A1B1C1',
        ]);
      });

      // Now we're going test the same thing during an update that
      // switches stores.
      await act(async () => {
        startTransition(() => {
          root.render(<App store={store2} />);
        });

        // Start a concurrent render that reads from the store, then yield.
        await waitFor(['A0', 'B0']);

        // During an interleaved event, the store is mutated.
        store2.set(1);

        // Then we continue rendering.
        await waitForAll([
          // C reads a newer value from the store than A or B, which means they
          // are inconsistent.
          'C1',

          // Before committing the layout effects, React detects that the store
          // has been mutated. So it throws out the entire completed tree and
          // re-renders the new values.
          'A1',
          'B1',
          'C1',
          // The layout effects reads consistent children.
          'Children observed during layout: A1B1C1',
        ]);
      });
    },
  );

  test('next value is correctly cached when state is dispatched in render phase', async () => {
    const store = createExternalStore('value:initial');

    function App() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      const [sameValue, setSameValue] = useState(value);
      if (value !== sameValue) setSameValue(value);
      return <Text text={value} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      // Start a render that reads from the store and yields value
      root.render(<App />);
    });
    assertLog(['value:initial']);

    await act(() => {
      store.set('value:changed');
    });
    assertLog(['value:changed']);

    // If cached value was updated, we expect a re-render
    await act(() => {
      store.set('value:initial');
    });
    assertLog(['value:initial']);
  });
});
