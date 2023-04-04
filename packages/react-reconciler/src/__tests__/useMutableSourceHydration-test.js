/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMClient;
let ReactDOMServer;
let Scheduler;
let act;
let createMutableSource;
let useMutableSource;
let waitFor;
let assertLog;

describe('useMutableSourceHydration', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');

    act = require('internal-test-utils').act;

    // Stable entrypoints export with "unstable_" prefix.
    createMutableSource =
      React.createMutableSource || React.unstable_createMutableSource;
    useMutableSource =
      React.useMutableSource || React.unstable_useMutableSource;

    const InternalTestUtils = require('internal-test-utils');
    waitFor = InternalTestUtils.waitFor;
    assertLog = InternalTestUtils.assertLog;
  });

  const defaultGetSnapshot = source => source.value;
  const defaultSubscribe = (source, callback) => source.subscribe(callback);

  function createComplexSource(initialValueA, initialValueB) {
    const callbacksA = [];
    const callbacksB = [];
    let revision = 0;
    let valueA = initialValueA;
    let valueB = initialValueB;

    const subscribeHelper = (callbacks, callback) => {
      if (callbacks.indexOf(callback) < 0) {
        callbacks.push(callback);
      }
      return () => {
        const index = callbacks.indexOf(callback);
        if (index >= 0) {
          callbacks.splice(index, 1);
        }
      };
    };

    return {
      subscribeA(callback) {
        return subscribeHelper(callbacksA, callback);
      },
      subscribeB(callback) {
        return subscribeHelper(callbacksB, callback);
      },

      get listenerCountA() {
        return callbacksA.length;
      },
      get listenerCountB() {
        return callbacksB.length;
      },

      set valueA(newValue) {
        revision++;
        valueA = newValue;
        callbacksA.forEach(callback => callback());
      },
      get valueA() {
        return valueA;
      },

      set valueB(newValue) {
        revision++;
        valueB = newValue;
        callbacksB.forEach(callback => callback());
      },
      get valueB() {
        return valueB;
      },

      get version() {
        return revision;
      },
    };
  }

  function createSource(initialValue) {
    const callbacks = [];
    let revision = 0;
    let value = initialValue;
    return {
      subscribe(callback) {
        if (callbacks.indexOf(callback) < 0) {
          callbacks.push(callback);
        }
        return () => {
          const index = callbacks.indexOf(callback);
          if (index >= 0) {
            callbacks.splice(index, 1);
          }
        };
      },
      get listenerCount() {
        return callbacks.length;
      },
      set value(newValue) {
        revision++;
        value = newValue;
        callbacks.forEach(callback => callback());
      },
      get value() {
        return value;
      },
      get version() {
        return revision;
      },
    };
  }

  function Component({getSnapshot, label, mutableSource, subscribe}) {
    const snapshot = useMutableSource(mutableSource, getSnapshot, subscribe);
    Scheduler.log(`${label}:${snapshot}`);
    return <div>{`${label}:${snapshot}`}</div>;
  }

  // @gate enableUseMutableSource
  it('should render and hydrate', async () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function TestComponent() {
      return (
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(<TestComponent />);
    container.innerHTML = htmlString;
    assertLog(['only:one']);
    expect(source.listenerCount).toBe(0);

    await act(() => {
      ReactDOMClient.hydrateRoot(container, <TestComponent />, {
        mutableSources: [mutableSource],
      });
    });
    assertLog(['only:one']);
    expect(source.listenerCount).toBe(1);
  });

  // @gate enableUseMutableSource
  // @gate enableClientRenderFallbackOnTextMismatch
  it('should detect a tear before hydrating a component', async () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function TestComponent() {
      return (
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(<TestComponent />);
    container.innerHTML = htmlString;
    assertLog(['only:one']);
    expect(source.listenerCount).toBe(0);

    await expect(async () => {
      await act(() => {
        ReactDOMClient.hydrateRoot(container, <TestComponent />, {
          mutableSources: [mutableSource],
          onRecoverableError(error) {
            Scheduler.log('Log error: ' + error.message);
          },
        });

        source.value = 'two';
      });
    }).toErrorDev(
      [
        'Warning: Text content did not match. Server: "only:one" Client: "only:two"',
        'Warning: An error occurred during hydration. The server HTML was replaced with client content in <div>.',
      ],
      {withoutStack: 1},
    );
    assertLog([
      'only:two',
      'only:two',
      'Log error: Text content does not match server-rendered HTML.',
      'Log error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.',
    ]);
    expect(source.listenerCount).toBe(1);
  });

  // @gate enableUseMutableSource
  it('should detect a tear between hydrating components', async () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function TestComponent() {
      return (
        <>
          <Component
            label="a"
            getSnapshot={defaultGetSnapshot}
            mutableSource={mutableSource}
            subscribe={defaultSubscribe}
          />
          <Component
            label="b"
            getSnapshot={defaultGetSnapshot}
            mutableSource={mutableSource}
            subscribe={defaultSubscribe}
          />
        </>
      );
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(<TestComponent />);
    container.innerHTML = htmlString;
    assertLog(['a:one', 'b:one']);
    expect(source.listenerCount).toBe(0);

    await expect(async () => {
      await act(async () => {
        if (gate(flags => flags.enableSyncDefaultUpdates)) {
          React.startTransition(() => {
            ReactDOMClient.hydrateRoot(container, <TestComponent />, {
              mutableSources: [mutableSource],
              onRecoverableError(error) {
                Scheduler.log('Log error: ' + error.message);
              },
            });
          });
        } else {
          ReactDOMClient.hydrateRoot(container, <TestComponent />, {
            mutableSources: [mutableSource],
            onRecoverableError(error) {
              Scheduler.log('Log error: ' + error.message);
            },
          });
        }
        await waitFor(['a:one']);
        source.value = 'two';
      });
    }).toErrorDev(
      'Warning: An error occurred during hydration. ' +
        'The server HTML was replaced with client content in <div>.',
      {withoutStack: true},
    );
    assertLog([
      'a:two',
      'b:two',
      // TODO: Before onRecoverableError, this error was never surfaced to the
      // user. The request to file an bug report no longer makes sense.
      // However, the experimental useMutableSource API is slated for
      // removal, anyway.
      'Log error: Cannot read from mutable source during the current ' +
        'render without tearing. This may be a bug in React. Please file ' +
        'an issue.',
      'Log error: There was an error while hydrating. Because the error ' +
        'happened outside of a Suspense boundary, the entire root will ' +
        'switch to client rendering.',
    ]);
    expect(source.listenerCount).toBe(2);
  });

  // @gate enableUseMutableSource
  it('should detect a tear between hydrating components reading from different parts of a source', async () => {
    const source = createComplexSource('a:one', 'b:one');
    const mutableSource = createMutableSource(source, param => param.version);

    // Subscribe to part of the store.
    const getSnapshotA = s => s.valueA;
    const subscribeA = (s, callback) => s.subscribeA(callback);
    const getSnapshotB = s => s.valueB;
    const subscribeB = (s, callback) => s.subscribeB(callback);

    const container = document.createElement('div');
    document.body.appendChild(container);

    const htmlString = ReactDOMServer.renderToString(
      <>
        <Component
          label="0"
          getSnapshot={getSnapshotA}
          mutableSource={mutableSource}
          subscribe={subscribeA}
        />
        <Component
          label="1"
          getSnapshot={getSnapshotB}
          mutableSource={mutableSource}
          subscribe={subscribeB}
        />
      </>,
    );
    container.innerHTML = htmlString;
    assertLog(['0:a:one', '1:b:one']);

    await expect(async () => {
      await act(async () => {
        const fragment = (
          <>
            <Component
              label="0"
              getSnapshot={getSnapshotA}
              mutableSource={mutableSource}
              subscribe={subscribeA}
            />
            <Component
              label="1"
              getSnapshot={getSnapshotB}
              mutableSource={mutableSource}
              subscribe={subscribeB}
            />
          </>
        );
        React.startTransition(() => {
          ReactDOMClient.hydrateRoot(container, fragment, {
            mutableSources: [mutableSource],
            onRecoverableError(error) {
              Scheduler.log('Log error: ' + error.message);
            },
          });
        });
        await waitFor(['0:a:one']);
        source.valueB = 'b:two';
      });
    }).toErrorDev(
      'Warning: An error occurred during hydration. ' +
        'The server HTML was replaced with client content in <div>.',
      {withoutStack: true},
    );
    assertLog([
      '0:a:one',
      '1:b:two',
      // TODO: Before onRecoverableError, this error was never surfaced to the
      // user. The request to file an bug report no longer makes sense.
      // However, the experimental useMutableSource API is slated for
      // removal, anyway.
      'Log error: Cannot read from mutable source during the current ' +
        'render without tearing. This may be a bug in React. Please file ' +
        'an issue.',
      'Log error: There was an error while hydrating. Because the error ' +
        'happened outside of a Suspense boundary, the entire root will ' +
        'switch to client rendering.',
    ]);
  });
});
