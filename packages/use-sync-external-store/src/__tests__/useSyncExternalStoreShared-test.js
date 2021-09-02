/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let useSyncExternalStore;
let useSyncExternalStoreExtra;
let React;
let ReactNoop;
let Scheduler;
let act;
let useState;
let useEffect;
let useLayoutEffect;

// This tests shared behavior between the built-in and shim implementations of
// of useSyncExternalStore.
describe('Shared useSyncExternalStore behavior (shim and built-in)', () => {
  beforeEach(() => {
    jest.resetModules();

    // Remove the built-in API from the React exports to force the package to
    // use the shim.
    // TODO: Don't do this during a variant test run. That way these tests run
    // against both the shim and the built-in implementation.
    jest.mock('react', () => {
      // eslint-disable-next-line no-unused-vars
      const {startTransition, ...otherExports} = jest.requireActual('react');
      return otherExports;
    });

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useState = React.useState;
    useEffect = React.useEffect;
    useLayoutEffect = React.useLayoutEffect;

    const internalAct = require('jest-react').act;

    // The internal act implementation doesn't batch updates by default, since
    // it's mostly used to test concurrent mode. But since these tests run
    // in both concurrent and legacy mode, I'm adding batching here.
    act = cb => internalAct(() => ReactNoop.batchedUpdates(cb));

    useSyncExternalStore = require('use-sync-external-store')
      .useSyncExternalStore;
    useSyncExternalStoreExtra = require('use-sync-external-store/extra')
      .useSyncExternalStoreExtra;
  });

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function createRoot(element) {
    // This wrapper function exists so we can test both legacy roots and
    // concurrent roots.
    //
    // TODO: Once the built-in API exists, conditionally test the concurrent
    // root API, too.
    const root = ReactNoop.createLegacyRoot();
    act(() => {
      root.render(element);
    });
    return root;
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

  test('basic usage', () => {
    const store = createExternalStore('Initial');

    function App() {
      const text = useSyncExternalStore(store.subscribe, store.getState);
      return <Text text={text} />;
    }

    const root = createRoot(<App />);

    expect(Scheduler).toHaveYielded(['Initial']);
    expect(root).toMatchRenderedOutput('Initial');

    act(() => {
      store.set('Updated');
    });
    expect(Scheduler).toHaveYielded(['Updated']);
    expect(root).toMatchRenderedOutput('Updated');
  });

  test('skips re-rendering if nothing changes', () => {
    const store = createExternalStore('Initial');

    function App() {
      const text = useSyncExternalStore(store.subscribe, store.getState);
      return <Text text={text} />;
    }

    const root = createRoot(<App />);

    expect(Scheduler).toHaveYielded(['Initial']);
    expect(root).toMatchRenderedOutput('Initial');

    // Update to the same value
    act(() => {
      store.set('Initial');
    });
    // Should not re-render
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('Initial');
  });

  test('switch to a different store', () => {
    const storeA = createExternalStore(0);
    const storeB = createExternalStore(0);

    let setStore;
    function App() {
      const [store, _setStore] = useState(storeA);
      setStore = _setStore;
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return <Text text={value} />;
    }

    const root = createRoot(<App />);

    expect(Scheduler).toHaveYielded([0]);
    expect(root).toMatchRenderedOutput('0');

    act(() => {
      storeA.set(1);
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('1');

    // Switch stores
    act(() => {
      // This update will be disregarded
      storeA.set(2);
      setStore(storeB);
    });
    // Now reading from B instead of A
    expect(Scheduler).toHaveYielded([0]);
    expect(root).toMatchRenderedOutput('0');

    // Update A
    act(() => {
      storeA.set(3);
    });
    // Nothing happened, because we're no longer subscribed to A
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('0');

    // Update B
    act(() => {
      storeB.set(1);
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('1');
  });

  test('selecting a specific value inside getSnapshot', () => {
    const store = createExternalStore({a: 0, b: 0});

    function A() {
      const a = useSyncExternalStore(store.subscribe, () => store.getState().a);
      return <Text text={'A' + a} />;
    }
    function B() {
      const b = useSyncExternalStore(store.subscribe, () => store.getState().b);
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

    const root = createRoot(<App />);

    expect(Scheduler).toHaveYielded(['A0', 'B0']);
    expect(root).toMatchRenderedOutput('A0B0');

    // Update b but not a
    act(() => {
      store.set({a: 0, b: 1});
    });
    // Only b re-renders
    expect(Scheduler).toHaveYielded(['B1']);
    expect(root).toMatchRenderedOutput('A0B1');

    // Update a but not b
    act(() => {
      store.set({a: 1, b: 1});
    });
    // Only a re-renders
    expect(Scheduler).toHaveYielded(['A1']);
    expect(root).toMatchRenderedOutput('A1B1');
  });

  test(
    "compares to current state before bailing out, even when there's a " +
      'mutation in between the sync and passive effects',
    () => {
      const store = createExternalStore(0);

      function App() {
        const value = useSyncExternalStore(store.subscribe, store.getState);
        useEffect(() => {
          Scheduler.unstable_yieldValue('Passive effect: ' + value);
        }, [value]);
        return <Text text={value} />;
      }

      const root = createRoot(<App />);
      expect(Scheduler).toHaveYielded([0, 'Passive effect: 0']);

      // Schedule an update. We'll intentionally not use `act` so that we can
      // insert a mutation before React subscribes to the store in a
      // passive effect.
      store.set(1);
      expect(Scheduler).toHaveYielded([
        1,
        // Passive effect hasn't fired yet
      ]);
      expect(root).toMatchRenderedOutput('1');

      // Flip the store state back to the previous value.
      store.set(0);
      expect(Scheduler).toHaveYielded([
        'Passive effect: 1',
        // Re-render. If the current state were tracked by updating a ref in a
        // passive effect, then this would break because the previous render's
        // passive effect hasn't fired yet, so we'd incorrectly think that
        // the state hasn't changed.
        0,
      ]);
      // Should flip back to 0
      expect(root).toMatchRenderedOutput('0');
    },
  );

  test('mutating the store in between render and commit when getSnapshot has changed', () => {
    const store = createExternalStore({a: 1, b: 1});

    const getSnapshotA = () => store.getState().a;
    const getSnapshotB = () => store.getState().b;

    function Child1({step}) {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      useLayoutEffect(() => {
        if (step === 1) {
          // Update B in a layout effect. This happens in the same commit
          // that changed the getSnapshot in Child2. Child2's effects haven't
          // fired yet, so it doesn't have access to the latest getSnapshot. So
          // it can't use the getSnapshot to bail out.
          Scheduler.unstable_yieldValue('Update B in commit phase');
          store.set({a: value.a, b: 2});
        }
      }, [step]);
      return null;
    }

    function Child2({step}) {
      const label = step === 0 ? 'A' : 'B';
      const getSnapshot = step === 0 ? getSnapshotA : getSnapshotB;
      const value = useSyncExternalStore(store.subscribe, getSnapshot);
      return <Text text={label + value} />;
    }

    let setStep;
    function App() {
      const [step, _setStep] = useState(0);
      setStep = _setStep;
      return (
        <>
          <Child1 step={step} />
          <Child2 step={step} />
        </>
      );
    }

    const root = createRoot(<App />);
    expect(Scheduler).toHaveYielded(['A1']);
    expect(root).toMatchRenderedOutput('A1');

    act(() => {
      // Change getSnapshot and update the store in the same batch
      setStep(1);
    });
    expect(Scheduler).toHaveYielded([
      'B1',
      'Update B in commit phase',
      // If Child2 had used the old getSnapshot to bail out, then it would have
      // incorrectly bailed out here instead of re-rendering.
      'B2',
    ]);
    expect(root).toMatchRenderedOutput('B2');
  });

  test('mutating the store in between render and commit when getSnapshot has _not_ changed', () => {
    // Same as previous test, but `getSnapshot` does not change
    const store = createExternalStore({a: 1, b: 1});

    const getSnapshotA = () => store.getState().a;

    function Child1({step}) {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      useLayoutEffect(() => {
        if (step === 1) {
          // Update B in a layout effect. This happens in the same commit
          // that changed the getSnapshot in Child2. Child2's effects haven't
          // fired yet, so it doesn't have access to the latest getSnapshot. So
          // it can't use the getSnapshot to bail out.
          Scheduler.unstable_yieldValue('Update B in commit phase');
          store.set({a: value.a, b: 2});
        }
      }, [step]);
      return null;
    }

    function Child2({step}) {
      const value = useSyncExternalStore(store.subscribe, getSnapshotA);
      return <Text text={'A' + value} />;
    }

    let setStep;
    function App() {
      const [step, _setStep] = useState(0);
      setStep = _setStep;
      return (
        <>
          <Child1 step={step} />
          <Child2 step={step} />
        </>
      );
    }

    const root = createRoot(<App />);
    expect(Scheduler).toHaveYielded(['A1']);
    expect(root).toMatchRenderedOutput('A1');

    // This will cause a layout effect, and in the layout effect we'll update
    // the store
    act(() => {
      setStep(1);
    });
    expect(Scheduler).toHaveYielded([
      'A1',
      // This updates B, but since Child2 doesn't subscribe to B, it doesn't
      // need to re-render.
      'Update B in commit phase',
      // No re-render
    ]);
    expect(root).toMatchRenderedOutput('A1');
  });

  test("does not bail out if the previous update hasn't finished yet", () => {
    const store = createExternalStore(0);

    function Child1() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      useLayoutEffect(() => {
        if (value === 1) {
          Scheduler.unstable_yieldValue('Reset back to 0');
          store.set(0);
        }
      }, [value]);
      return <Text text={value} />;
    }

    function Child2() {
      const value = useSyncExternalStore(store.subscribe, store.getState);
      return <Text text={value} />;
    }

    const root = createRoot(
      <>
        <Child1 />
        <Child2 />
      </>,
    );
    expect(Scheduler).toHaveYielded([0, 0]);
    expect(root).toMatchRenderedOutput('00');

    act(() => {
      store.set(1);
    });
    expect(Scheduler).toHaveYielded([1, 1, 'Reset back to 0', 0, 0]);
    expect(root).toMatchRenderedOutput('00');
  });

  test('uses the latest getSnapshot, even if it changed in the same batch as a store update', () => {
    const store = createExternalStore({a: 0, b: 0});

    const getSnapshotA = () => store.getState().a;
    const getSnapshotB = () => store.getState().b;

    let setGetSnapshot;
    function App() {
      const [getSnapshot, _setGetSnapshot] = useState(() => getSnapshotA);
      setGetSnapshot = _setGetSnapshot;
      const text = useSyncExternalStore(store.subscribe, getSnapshot);
      return <Text text={text} />;
    }

    const root = createRoot(<App />);
    expect(Scheduler).toHaveYielded([0]);

    // Update the store and getSnapshot at the same time
    act(() => {
      setGetSnapshot(() => getSnapshotB);
      store.set({a: 1, b: 2});
    });
    // It should read from B instead of A
    expect(Scheduler).toHaveYielded([2]);
    expect(root).toMatchRenderedOutput('2');
  });

  test('handles errors thrown by getSnapshot or isEqual', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    const store = createExternalStore({
      value: 0,
      throwInGetSnapshot: false,
      throwInIsEqual: false,
    });

    function App() {
      const {value} = useSyncExternalStore(
        store.subscribe,
        () => {
          const state = store.getState();
          if (state.throwInGetSnapshot) {
            throw new Error('Error in getSnapshot');
          }
          return state;
        },
        {
          isEqual: (a, b) => {
            if (a.throwInIsEqual || b.throwInIsEqual) {
              throw new Error('Error in isEqual');
            }
            return a.value === b.value;
          },
        },
      );
      return <Text text={value} />;
    }

    const errorBoundary = React.createRef(null);
    const root = createRoot(
      <ErrorBoundary ref={errorBoundary}>
        <App />
      </ErrorBoundary>,
    );
    expect(Scheduler).toHaveYielded([0]);
    expect(root).toMatchRenderedOutput('0');

    // Update that throws in a getSnapshot. We can catch it with an error boundary.
    act(() => {
      store.set({value: 1, throwInGetSnapshot: true, throwInIsEqual: false});
    });
    expect(Scheduler).toHaveYielded(['Error in getSnapshot']);
    expect(root).toMatchRenderedOutput('Error in getSnapshot');

    // Clear the error.
    act(() => {
      store.set({value: 1, throwInGetSnapshot: false, throwInIsEqual: false});
      errorBoundary.current.setState({error: null});
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('1');

    // Update that throws in isEqual. Since isEqual only prevents a bail out,
    // we don't need to surface an error. But we do have to re-render.
    act(() => {
      store.set({value: 1, throwInGetSnapshot: false, throwInIsEqual: true});
    });
    expect(Scheduler).toHaveYielded([1]);
    expect(root).toMatchRenderedOutput('1');
  });

  describe('extra features implemented in user-space', () => {
    test('memoized selectors are only called once per update', () => {
      const store = createExternalStore({a: 0, b: 0});

      function selector(state) {
        Scheduler.unstable_yieldValue('Selector');
        return state.a;
      }

      function App() {
        Scheduler.unstable_yieldValue('App');
        const a = useSyncExternalStoreExtra(
          store.subscribe,
          store.getState,
          selector,
        );
        return <Text text={'A' + a} />;
      }

      const root = createRoot(<App />);

      expect(Scheduler).toHaveYielded(['App', 'Selector', 'A0']);
      expect(root).toMatchRenderedOutput('A0');

      // Update the store
      act(() => {
        store.set({a: 1, b: 0});
      });
      expect(Scheduler).toHaveYielded([
        // The selector runs before React starts rendering
        'Selector',
        'App',
        // And because the selector didn't change during render, we can reuse
        // the previous result without running the selector again
        'A1',
      ]);
      expect(root).toMatchRenderedOutput('A1');
    });

    test('Using isEqual to bailout', () => {
      const store = createExternalStore({a: 0, b: 0});

      function A() {
        const {a} = useSyncExternalStoreExtra(
          store.subscribe,
          store.getState,
          state => ({a: state.a}),
          (state1, state2) => state1.a === state2.a,
        );
        return <Text text={'A' + a} />;
      }
      function B() {
        const {b} = useSyncExternalStoreExtra(
          store.subscribe,
          store.getState,
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

      const root = createRoot(<App />);

      expect(Scheduler).toHaveYielded(['A0', 'B0']);
      expect(root).toMatchRenderedOutput('A0B0');

      // Update b but not a
      act(() => {
        store.set({a: 0, b: 1});
      });
      // Only b re-renders
      expect(Scheduler).toHaveYielded(['B1']);
      expect(root).toMatchRenderedOutput('A0B1');

      // Update a but not b
      act(() => {
        store.set({a: 1, b: 1});
      });
      // Only a re-renders
      expect(Scheduler).toHaveYielded(['A1']);
      expect(root).toMatchRenderedOutput('A1B1');
    });
  });
});
