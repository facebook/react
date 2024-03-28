/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let useSyncExternalStoreWithSelector;
let React;
let ReactDOM;
let ReactDOMClient;
let ReactFeatureFlags;
let act;

describe('useSyncExternalStoreWithSelector', () => {
  beforeEach(() => {
    jest.resetModules();

    if (gate(flags => flags.enableUseSyncExternalStoreShim)) {
      // Remove useSyncExternalStore from the React imports so that we use the
      // shim instead. Also removing startTransition, since we use that to
      // detect outdated 18 alphas that don't yet include useSyncExternalStore.
      //
      // Longer term, we'll probably test this branch using an actual build
      // of React 17.
      jest.mock('react', () => {
        const {
          // eslint-disable-next-line no-unused-vars
          startTransition: _,
          // eslint-disable-next-line no-unused-vars
          useSyncExternalStore: __,
          ...otherExports
        } = jest.requireActual('react');
        return otherExports;
      });
    }

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');

    const internalAct = require('internal-test-utils').act;

    // The internal act implementation doesn't batch updates by default, since
    // it's mostly used to test concurrent mode. But since these tests run
    // in both concurrent and legacy mode, I'm adding batching here.
    act = cb => internalAct(() => ReactDOM.unstable_batchedUpdates(cb));

    if (gate(flags => flags.source)) {
      // The `shim/with-selector` module composes the main
      // `use-sync-external-store` entrypoint. In the compiled artifacts, this
      // is resolved to the `shim` implementation by our build config, but when
      // running the tests against the source files, we need to tell Jest how to
      // resolve it. Because this is a source module, this mock has no affect on
      // the build tests.
      jest.mock('use-sync-external-store/src/useSyncExternalStore', () =>
        jest.requireActual('use-sync-external-store/shim'),
      );
    }
    useSyncExternalStoreWithSelector =
      require('use-sync-external-store/shim/with-selector').useSyncExternalStoreWithSelector;
  });

  function createRoot(container) {
    // This wrapper function exists so we can test both legacy roots and
    // concurrent roots.
    if (gate(flags => !flags.enableUseSyncExternalStoreShim)) {
      // The native implementation only exists in 18+, so we test using
      // concurrent mode. To test the legacy root behavior in the native
      // implementation (which is supported in the sense that it needs to have
      // the correct behavior, despite the fact that the legacy root API
      // triggers a warning in 18), write a test that uses
      // createLegacyRoot directly.
      return ReactDOMClient.createRoot(container);
    } else {
      ReactDOM.render(null, container);
      return {
        render(children) {
          ReactDOM.render(children, container);
        },
      };
    }
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

  test('should call selector on change accessible segment', async () => {
    const store = createExternalStore({a: '1', b: '2'});

    const selectorFn = jest.fn();
    const selector = state => {
      selectorFn();
      return state.a;
    };

    function App() {
      const data = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        null,
        selector,
      );
      return <>{data}</>;
    }

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(selectorFn).toHaveBeenCalledTimes(1);

    await expect(async () => {
      await act(() => {
        store.set({a: '2', b: '2'});
      });
    }).toWarnDev(
      ReactFeatureFlags.enableUseRefAccessWarning
        ? ['Warning: App: Unsafe read of a mutable value during render.']
        : [],
    );

    expect(selectorFn).toHaveBeenCalledTimes(2);
  });

  test('should not call selector if nothing changed', async () => {
    const store = createExternalStore({a: '1', b: '2'});

    const selectorFn = jest.fn();
    const selector = state => {
      selectorFn();
      return state.a;
    };

    function App() {
      const data = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        null,
        selector,
      );
      return <>{data}</>;
    }

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(selectorFn).toHaveBeenCalledTimes(1);

    await act(() => {
      store.set({a: '1', b: '2'});
    });

    expect(selectorFn).toHaveBeenCalledTimes(1);
  });

  test('should not call selector on change not accessible segment', async () => {
    const store = createExternalStore({a: '1', b: '2'});

    const selectorFn = jest.fn();
    const selector = state => {
      selectorFn();
      return state.a;
    };

    function App() {
      const data = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        null,
        selector,
      );
      return <>{data}</>;
    }

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => {
      root.render(<App />);
    });

    expect(selectorFn).toHaveBeenCalledTimes(1);

    await act(() => {
      store.set({a: '1', b: '3'});
    });

    expect(selectorFn).toHaveBeenCalledTimes(1);
  });
});
