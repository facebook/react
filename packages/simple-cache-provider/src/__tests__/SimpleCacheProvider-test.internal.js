/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let SimpleCacheProvider;
let Provider;
// let useCache;
let React;
let ReactFeatureFlags;
let ReactNoop;
// let Fragment;
let Placeholder;
let TextResource;
let textResourceShouldFail;
let VersionedTextResource;
let bumpTextVersion;
let getSubscriptionCountForText;

describe('SimpleCacheProvider', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactFeatureFlags.enableSuspense = true;
    React = require('react');
    // Fragment = React.Fragment;
    Placeholder = React.Placeholder;
    SimpleCacheProvider = require('simple-cache-provider');
    Provider = SimpleCacheProvider.Provider;
    // useCache = SimpleCacheProvider.useCache;
    ReactNoop = require('react-noop-renderer');

    textResourceShouldFail = false;
    TextResource = SimpleCacheProvider.createResource(([text, ms = 0]) => {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          if (textResourceShouldFail) {
            ReactNoop.yield(`Promise rejected [${text}]`);
            reject(new Error('Failed to load: ' + text));
          } else {
            ReactNoop.yield(`Promise resolved [${text}]`);
            resolve(text);
          }
        }, ms),
      );
    }, ([text, ms]) => text);

    const textVersions = new Map();
    const textSubscribers = new Map();

    bumpTextVersion = text => {
      const currentVersion = textVersions.has(text)
        ? textVersions.get(text)
        : 0;
      const nextVersion = currentVersion + 1;
      textVersions.set(text, nextVersion);
      const listeners = textSubscribers.get(text);
      if (listeners !== undefined) {
        listeners.forEach(l => l(nextVersion));
      }
    };

    getSubscriptionCountForText = text => {
      const listeners = textSubscribers.get(text);
      return listeners === undefined ? 0 : listeners.size;
    };

    // Similar to TextResource, but emits versioned text strings. E.g. for the
    // given text "Foo", VersionedTextResource returns "Foo (v0)" on the first
    // read. When the version is bumped, it emits "Foo (v1)" and so on.
    VersionedTextResource = SimpleCacheProvider.createObservableResource(
      ([text, ms = 0]) => {
        return {
          subscribe(observer) {
            // Listen for changes to the text's version
            const listener = version => {
              // Wait for the given number of milliseconds then push an update
              setTimeout(() => {
                const versionedText = `${text} (v${version})`;
                ReactNoop.yield(`Update to v${version} [${text}]`);
                observer.next(versionedText);
              }, ms);
            };
            let listeners = textSubscribers.get(text);
            if (listeners === undefined) {
              listeners = new Set();
              textSubscribers.set(text, listeners);
            }
            listeners.add(listener);
            // Emit the initial version.
            listener(0);
            return {
              unsubscribe() {
                listeners.delete(listener);
              },
            };
          },
        };
      },
      ([text, ms]) => text,
    );
  });

  // function div(...children) {
  //   children = children.map(c => (typeof c === 'string' ? {text: c} : c));
  //   return {type: 'div', children, prop: undefined};
  // }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function advanceTimers(ms) {
    // Note: This advances Jest's virtual time but not React's. Use
    // ReactNoop.expire for that.
    if (typeof ms !== 'number') {
      throw new Error('Must specify ms');
    }
    jest.advanceTimersByTime(ms);
    // Wait until the end of the current tick
    return new Promise(resolve => {
      setImmediate(resolve);
    });
  }

  // function Text(props) {
  //   ReactNoop.yield(props.text);
  //   return <span prop={props.text} />;
  // }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read([props.text, props.ms]);
      ReactNoop.yield(text);
      return <span prop={text} />;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        ReactNoop.yield(`Suspend! [${text}]`);
      } else {
        ReactNoop.yield(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  function VersionedText(props) {
    const text = props.text;
    try {
      const versionedText = VersionedTextResource.read([props.text, props.ms]);
      ReactNoop.yield(versionedText);
      return <span prop={versionedText} />;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        ReactNoop.yield(`Suspend! [${text}]`);
      } else {
        ReactNoop.yield(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('throws a promise if the requested value is not in the cache', async () => {
    function App() {
      return (
        <Placeholder>
          <AsyncText ms={100} text="Hi" />
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Hi]']);

    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual(['Promise resolved [Hi]', 'Hi']);
    expect(ReactNoop.getChildren()).toEqual([span('Hi')]);
  });

  it('throws an error on the subsequent read if the promise is rejected', async () => {
    function App() {
      return (
        <Placeholder>
          <AsyncText ms={100} text="Hi" />
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Hi]']);

    textResourceShouldFail = true;
    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(() => ReactNoop.flush()).toThrow('Failed to load: Hi');

    // Should throw again on a subsequent read
    ReactNoop.render(<App />);
    expect(() => ReactNoop.flush()).toThrow('Failed to load: Hi');
  });

  it('warns if non-primitive key is passed to a resource without a hash function', () => {
    TextResource = SimpleCacheProvider.createResource(([text, ms = 0]) => {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          if (textResourceShouldFail) {
            ReactNoop.yield(`Promise rejected [${text}]`);
            reject(new Error('Failed to load: ' + text));
          } else {
            ReactNoop.yield(`Promise resolved [${text}]`);
            resolve(text);
          }
        }, ms),
      );
    });

    function App() {
      return (
        <Placeholder>
          <AsyncText ms={100} text="Hi" />
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);

    if (__DEV__) {
      expect(() => {
        expect(ReactNoop.flush()).toEqual(['Suspend! [Hi]']);
      }).toWarnDev(
        [
          'Invalid key type. Expected a string, number, symbol, or ' +
            'boolean, but instead received: Hi,100\n\n' +
            'To use non-primitive values as keys, you must pass a hash ' +
            'function as the second argument to createResource().',
        ],
        {withoutStack: true},
      );
    } else {
      expect(ReactNoop.flush()).toEqual(['Suspend! [Hi]']);
    }
  });

  it('subscribes to an observable resource', async () => {
    function App() {
      return (
        <Provider>
          <Placeholder>
            <VersionedText ms={100} text="A" />
            <VersionedText ms={100} text="B" />
            <VersionedText ms={100} text="A" />
          </Placeholder>
        </Provider>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual([
      'Suspend! [A]',
      'Suspend! [B]',
      'Suspend! [A]',
    ]);

    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Update to v0 [A]',
      'Update to v0 [B]',
      'A (v0)',
      'B (v0)',
      'A (v0)',
    ]);
    // Even though two separate component read "A", there should only be a
    // single subscription
    expect(getSubscriptionCountForText('A')).toEqual(1);
    expect(getSubscriptionCountForText('B')).toEqual(1);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v0)'),
      span('B (v0)'),
      span('A (v0)'),
    ]);

    // Bump the version of A
    bumpTextVersion('A');
    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Update to v1 [A]',
      'A (v1)',
      'B (v0)',
      'A (v1)',
    ]);
    expect(getSubscriptionCountForText('A')).toEqual(1);
    expect(getSubscriptionCountForText('B')).toEqual(1);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v1)'),
      span('B (v0)'),
      span('A (v1)'),
    ]);
  });

  it('unsubscribes from an observable resource', async () => {
    function App({showB}) {
      return (
        <Provider>
          <Placeholder>
            <VersionedText ms={100} text="A" />
            {showB ? <VersionedText ms={100} text="B" /> : null}
            <VersionedText ms={100} text="A" />
          </Placeholder>
        </Provider>
      );
    }

    ReactNoop.render(<App showB={true} />);
    expect(ReactNoop.flush()).toEqual([
      'Suspend! [A]',
      'Suspend! [B]',
      'Suspend! [A]',
    ]);

    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Update to v0 [A]',
      'Update to v0 [B]',
      'A (v0)',
      'B (v0)',
      'A (v0)',
    ]);
    expect(getSubscriptionCountForText('A')).toEqual(1);
    expect(getSubscriptionCountForText('B')).toEqual(1);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v0)'),
      span('B (v0)'),
      span('A (v0)'),
    ]);

    // Update the snapshot
    bumpTextVersion('B');
    ReactNoop.expire(100);
    await advanceTimers(100);

    // In the same batch, unmount the component that reads from B.
    ReactNoop.render(<App showB={false} />);
    expect(ReactNoop.flush()).toEqual(['Update to v1 [B]', 'A (v0)', 'A (v0)']);

    expect(getSubscriptionCountForText('A')).toEqual(1);
    // The subscription for B should have been disposed.
    expect(getSubscriptionCountForText('B')).toEqual(0);
    expect(ReactNoop.getChildren()).toEqual([span('A (v0)'), span('A (v0)')]);
  });
});

// TODO:
// Reading from an observable resource throws if there's no provider
// Mounting two sibling providers in the same batch should create two separate subscriptions
