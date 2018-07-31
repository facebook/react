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
let CacheProvider;
let createResource;
let useCache;
let React;
let ReactFeatureFlags;
let ReactNoop;
let Placeholder;
let createText;
let createVersionedText;
let Label;
let flushScheduledWork;
let evictLRU;

describe('SimpleCacheProvider', () => {
  beforeEach(() => {
    jest.resetModules();

    jest.mock('react-scheduler', () => {
      let callbacks = [];
      function recursivelyCallCallbacks() {
        if (callbacks.length > 0) {
          try {
            const callback = callbacks.pop();
            callback();
          } finally {
            recursivelyCallCallbacks();
          }
        }
      }
      return {
        scheduleWork(callback) {
          const callbackIndex = callbacks.length;
          callbacks.push(callback);
          return {callbackIndex};
        },
        flushScheduledWork() {
          recursivelyCallCallbacks();
        },
      };
    });

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactFeatureFlags.enableSuspense = true;
    React = require('react');
    // Fragment = React.Fragment;
    Placeholder = React.Placeholder;
    SimpleCacheProvider = require('simple-cache-provider');
    CacheProvider = SimpleCacheProvider.CacheProvider;
    createResource = SimpleCacheProvider.createResource;
    useCache = SimpleCacheProvider.useCache;
    ReactNoop = require('react-noop-renderer');
    flushScheduledWork = require('react-scheduler').flushScheduledWork;
    evictLRU = flushScheduledWork;

    Label = ({text}) => {
      ReactNoop.yield(text);
      return <span prop={text} />;
    };

    createText = () => {
      const Resource = createResource(([text, ms = 0]) => {
        return new Promise((resolve, reject) =>
          setTimeout(() => {
            if (result.shouldFail) {
              ReactNoop.yield(`Promise rejected [${text}]`);
              reject(new Error('Failed to load: ' + text));
            } else {
              ReactNoop.yield(`Promise resolved [${text}]`);
              resolve(text);
            }
          }, ms),
        );
      }, ([text, ms]) => text);

      const label = function AsyncLabel(props) {
        const text = props.text;
        try {
          Resource.read([props.text, props.ms]);
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
      };

      const result = {
        label,
        Resource,
        shouldFail: false,
      };
      return result;
    };

    createVersionedText = () => {
      const versions = new Map();
      const listeners = new Map();

      const bumpVersion = text => {
        const currentVersion = versions.has(text) ? versions.get(text) : 0;
        const nextVersion = currentVersion + 1;
        versions.set(text, nextVersion);
        const listener = listeners.get(text);
        if (listener !== undefined) {
          listener();
        }
      };

      const hasSubscription = text => {
        return listeners.has(text);
      };

      const Resource = createResource(([text, ms = 0]) => {
        return {
          subscribe(observer) {
            // Listen for changes to the text's version
            if (listeners.has(text)) {
              throw new Error(
                'Should not have multiple subscriptions for the same key',
              );
            }

            const listener = () => {
              // Wait for the given number of milliseconds then push an update
              const version = versions.has(text) ? versions.get(text) : 0;
              const versionedText = `${text} (v${version})`;
              ReactNoop.yield(`Update to v${version} [${text}]`);
              observer.next(versionedText);
            };

            listeners.set(text, listener);
            // Wait, then emit the initial version.
            setTimeout(listener, ms);
            return {
              unsubscribe() {
                listeners.delete(text);
              },
            };
          },
        };
      }, ([text, ms]) => text);

      const label = function VersionedLabel(props) {
        const text = props.text;
        try {
          const versionedText = Resource.read([props.text, props.ms]);
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
      };

      const result = {
        label,
        Resource,
        bumpVersion,
        hasSubscription,
        shouldFail: false,
      };
      return result;
    };
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

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // function Text(props) {
  //   ReactNoop.yield(props.text);
  //   return <span prop={props.text} />;
  // }

  it('throws a promise if the requested value is not in the cache', async () => {
    const Text = createText();

    function App() {
      return (
        <Placeholder>
          <Text.label ms={100} text="Hi" />
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
    const Text = createText();

    function App() {
      return (
        <Placeholder>
          <Text.label ms={100} text="Hi" />
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Hi]']);

    Text.shouldFail = true;
    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(() => ReactNoop.flush()).toThrow('Failed to load: Hi');

    // Should throw again on a subsequent read
    ReactNoop.render(<App />);
    expect(() => ReactNoop.flush()).toThrow('Failed to load: Hi');
  });

  it('warns if non-primitive key is passed to a resource without a hash function', () => {
    const TextResource = createResource(([text, ms = 0]) => {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          resolve(text);
        }, ms),
      );
    });

    function App() {
      ReactNoop.yield('App');
      return TextResource.read(['Hi', 100]);
    }

    ReactNoop.render(
      <Placeholder>
        <App />
      </Placeholder>,
    );

    if (__DEV__) {
      expect(() => {
        expect(ReactNoop.flush()).toEqual(['App']);
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
      expect(ReactNoop.flush()).toEqual(['App']);
    }
  });

  it('subscribes to an observable resource', async () => {
    const Text = createVersionedText();

    function App() {
      return (
        <Placeholder>
          <Text.label ms={100} text="A" />
          <Text.label ms={100} text="B" />
          <Text.label ms={100} text="A" />
        </Placeholder>
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
    expect(Text.hasSubscription('A')).toBe(true);
    expect(Text.hasSubscription('B')).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v0)'),
      span('B (v0)'),
      span('A (v0)'),
    ]);

    // Bump the version of A
    Text.bumpVersion('A');
    expect(ReactNoop.flush()).toEqual(['Update to v1 [A]', 'A (v1)', 'A (v1)']);
    expect(Text.hasSubscription('A')).toEqual(true);
    expect(Text.hasSubscription('B')).toEqual(true);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v1)'),
      span('B (v0)'),
      span('A (v1)'),
    ]);
  });

  it('unsubscribes from an observable resource', async () => {
    const Text = createVersionedText();

    function App({showB}) {
      return (
        <Placeholder>
          <Text.label ms={100} text="A" />
          {showB ? <Text.label ms={100} text="B" /> : null}
          <Text.label ms={100} text="A" />
        </Placeholder>
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
    expect(Text.hasSubscription('A')).toEqual(true);
    expect(Text.hasSubscription('B')).toEqual(true);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v0)'),
      span('B (v0)'),
      span('A (v0)'),
    ]);

    // Bump the version of B.
    Text.bumpVersion('B');

    // In the same batch, unmount the component that reads from B.
    ReactNoop.render(<App showB={false} />);
    expect(ReactNoop.flush()).toEqual(['Update to v1 [B]', 'A (v0)', 'A (v0)']);

    expect(Text.hasSubscription('A')).toEqual(true);
    // The subscription for B should have been disposed.
    expect(Text.hasSubscription('B')).toEqual(false);
    expect(ReactNoop.getChildren()).toEqual([span('A (v0)'), span('A (v0)')]);
  });

  it('subscribes to multiple resources', async () => {
    const Text1 = createVersionedText();
    const Text2 = createVersionedText();

    function App() {
      return (
        <Placeholder>
          <Text1.label ms={100} text="A" />
          <Text2.label ms={100} text="A" />
          <Text1.label ms={100} text="B" />
          <Text2.label ms={100} text="B" />
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual([
      'Suspend! [A]',
      'Suspend! [A]',
      'Suspend! [B]',
      'Suspend! [B]',
    ]);

    ReactNoop.expire(200);
    await advanceTimers(200);

    expect(ReactNoop.flush()).toEqual([
      'Update to v0 [A]',
      'Update to v0 [A]',
      'Update to v0 [B]',
      'Update to v0 [B]',
      'A (v0)',
      'A (v0)',
      'B (v0)',
      'B (v0)',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v0)'),
      span('A (v0)'),
      span('B (v0)'),
      span('B (v0)'),
    ]);

    // Update Text1's A version. Text2's A version should stay the same.
    Text1.bumpVersion('A');
    expect(ReactNoop.flush()).toEqual(['Update to v1 [A]', 'A (v1)', 'A (v0)']);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v1)'),
      span('A (v0)'),
      span('B (v0)'),
      span('B (v0)'),
    ]);
  });

  it("unsubscribes from unmounted subscriptions, but keeps last value cached in case it's added back", async () => {
    const Text = createVersionedText();

    function App({showGreeting}) {
      return (
        <Placeholder>
          {showGreeting ? <Text.label ms={100} text="Hi" /> : null}
        </Placeholder>
      );
    }

    ReactNoop.render(<App showGreeting={true} />);
    expect(ReactNoop.flush()).toEqual(['Suspend! [Hi]']);
    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual(['Update to v0 [Hi]', 'Hi (v0)']);
    expect(Text.hasSubscription('Hi')).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([span('Hi (v0)')]);

    // Update the version
    Text.bumpVersion('Hi');
    expect(ReactNoop.flush()).toEqual(['Update to v1 [Hi]', 'Hi (v1)']);
    expect(Text.hasSubscription('Hi')).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([span('Hi (v1)')]);

    // Unmount the consumer
    ReactNoop.render(<App showGreeting={false} />);
    expect(ReactNoop.flush()).toEqual([]);
    expect(Text.hasSubscription('Hi')).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Update the version again. Because there are no matching consumers, the
    // subscription will be disposed.
    Text.bumpVersion('Hi');
    expect(ReactNoop.flush()).toEqual(['Update to v2 [Hi]']);
    expect(Text.hasSubscription('Hi')).toBe(false);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Update one more time. This will update the version, but since the
    // subscription was disposed, it won't trigger a re-render.
    Text.bumpVersion('Hi');

    // Mount a new consumer. The previous subscription no longer exists, so
    // we'll need to create a new one. However, the previous value is still
    // cached, even though it's stale (v2 instead of v3). We should render
    // the stale value without suspended, then update again once the freshest
    // value comes back.
    ReactNoop.render(<App showGreeting={true} />);
    // Does not suspend.
    expect(ReactNoop.flush()).toEqual(['Hi (v2)']);
    expect(Text.hasSubscription('Hi')).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([span('Hi (v2)')]);

    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual(['Update to v3 [Hi]', 'Hi (v3)']);
    expect(Text.hasSubscription('Hi')).toBe(true);
    expect(ReactNoop.getChildren()).toEqual([span('Hi (v3)')]);
  });

  it('evicts least recently used values', async () => {
    const Text = createText();

    SimpleCacheProvider.setGlobalCacheLimit(3);

    // Render 1, 2, and 3
    ReactNoop.render(
      <Placeholder>
        <Text.label ms={100} text={1} />
        <Text.label ms={100} text={2} />
        <Text.label ms={100} text={3} />
      </Placeholder>,
    );
    expect(ReactNoop.flush()).toEqual([
      'Suspend! [1]',
      'Suspend! [2]',
      'Suspend! [3]',
    ]);
    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [1]',
      'Promise resolved [2]',
      'Promise resolved [3]',
      1,
      2,
      3,
    ]);
    expect(ReactNoop.getChildren()).toEqual([span(1), span(2), span(3)]);

    // Render 1, 4, 5
    ReactNoop.render(
      <Placeholder>
        <Text.label ms={100} text={1} />
        <Text.label ms={100} text={4} />
        <Text.label ms={100} text={5} />
      </Placeholder>,
    );
    expect(ReactNoop.flush()).toEqual([1, 'Suspend! [4]', 'Suspend! [5]']);
    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [4]',
      'Promise resolved [5]',
      1,
      4,
      5,
    ]);
    expect(ReactNoop.getChildren()).toEqual([span(1), span(4), span(5)]);

    // We've now rendered values 1, 2, 3, 4, 5, over our limit of 3. The least
    // recently used values are 2 and 3. They will be evicted during the
    // next sweep.
    evictLRU();

    ReactNoop.render(
      <Placeholder>
        <Text.label ms={100} text={1} />
        <Text.label ms={100} text={2} />
        <Text.label ms={100} text={3} />
      </Placeholder>,
    );
    expect(ReactNoop.flush()).toEqual([
      // 1 is still cached
      1,
      // 2 and 3 suspend because they were evicted from the cache
      'Suspend! [2]',
      'Suspend! [3]',
    ]);
    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [2]',
      'Promise resolved [3]',
      1,
      2,
      3,
    ]);
    expect(ReactNoop.getChildren()).toEqual([span(1), span(2), span(3)]);
  });

  it('preloads during the render phase', async () => {
    const Text = createText();

    function App() {
      Text.Resource.preload(['B', 1000]);
      Text.Resource.read(['A', 1000]);
      Text.Resource.read(['B', 1000]);
      return <Label text="Result" />;
    }

    ReactNoop.render(
      <Placeholder>
        <App />
      </Placeholder>,
    );
    expect(ReactNoop.flush()).toEqual([]);
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual([
      'Promise resolved [B]',
      'Promise resolved [A]',
      'Result',
    ]);
    expect(ReactNoop.getChildren()).toEqual([span('Result')]);
  });

  it('updates at multiple priorities', async () => {
    const Text = createVersionedText();

    function App() {
      return (
        <Placeholder>
          <CacheProvider>
            <Text.label ms={100} text="A" />
            <Text.label ms={100} text="B" />
            <Text.label ms={100} text="C" />
          </CacheProvider>
        </Placeholder>
      );
    }

    ReactNoop.render(<App />);
    // Initial mount is empty.
    expect(ReactNoop.flush()).toEqual([]);
    // After initial mount, render children.
    flushScheduledWork();

    expect(ReactNoop.flush()).toEqual([
      'Suspend! [A]',
      'Suspend! [B]',
      'Suspend! [C]',
    ]);

    ReactNoop.expire(100);
    await advanceTimers(100);

    expect(ReactNoop.flush()).toEqual([
      'Update to v0 [A]',
      'Update to v0 [B]',
      'Update to v0 [C]',
      'A (v0)',
      'B (v0)',
      'C (v0)',
    ]);

    expect(ReactNoop.getChildren()).toEqual([
      span('A (v0)'),
      span('B (v0)'),
      span('C (v0)'),
    ]);

    // Schedule some low priority updates
    Text.bumpVersion('A');
    Text.bumpVersion('B');
    Text.bumpVersion('C');

    // Flush some of it
    ReactNoop.flushThrough([
      'Update to v1 [A]',
      'Update to v1 [B]',
      'Update to v1 [C]',
      'A (v1)',
      'B (v1)',
      // Stop before rendering C
    ]);

    // Interrupt with a high priority update to B
    ReactNoop.flushSync(() => {
      Text.bumpVersion('B');
    });
    expect(ReactNoop.flushExpired()).toEqual([
      // Only B re-renders
      'Update to v2 [B]',
      'B (v2)',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v0)'),
      span('B (v2)'),
      span('C (v0)'),
    ]);

    // Now flush the rest of the low pri work
    expect(ReactNoop.flush()).toEqual(['A (v1)', 'B (v2)', 'C (v1)']);
    expect(ReactNoop.getChildren()).toEqual([
      span('A (v1)'),
      span('B (v2)'),
      span('C (v1)'),
    ]);
  });

  it('updates using `set`', async () => {
    const StoryResource = createResource(async id => {
      ReactNoop.yield(`Started fetching story ${id}`);
      await wait(1000);
      if (id === '123') {
        return {
          title: 'Why Andrew is smort',
          authorID: 'acdlite',
        };
      }
      throw new Error('Story not found.');
    });

    const UserResource = createResource(async id => {
      ReactNoop.yield(`Started fetching user ${id}`);
      await wait(100);
      if (id === 'acdlite') {
        return {
          name: 'Andrew Clark',
        };
      }
      throw new Error('User not found.');
    });

    let cache;
    function Story(props) {
      cache = useCache();
      const story = StoryResource.read(props.id);
      const author = UserResource.read(story.authorID);
      return (
        <React.Fragment>
          <Label text={story.title} />
          <Label text={`By ${author.name}`} />
        </React.Fragment>
      );
    }

    ReactNoop.render(
      <Placeholder>
        <Story id="123" />
      </Placeholder>,
    );
    expect(ReactNoop.flush()).toEqual(['Started fetching story 123']);

    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual(['Started fetching user acdlite']);

    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Why Andrew is smort',
      'By Andrew Clark',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Why Andrew is smort'),
      span('By Andrew Clark'),
    ]);

    cache.set(StoryResource, '123', {
      title: 'Why spelling is for losers',
      authorID: 'acdlite',
    });

    expect(ReactNoop.flush()).toEqual([
      'Why spelling is for losers',
      'By Andrew Clark',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Why spelling is for losers'),
      span('By Andrew Clark'),
    ]);
  });

  it('invalidates using `invalidate`', async () => {
    const remoteData = {
      stories: {
        '123': {
          title: 'Why Andrew is smort',
          authorID: 'acdlite',
        },
      },
      users: {
        acdlite: {
          name: 'Andrew Clark',
        },
      },
    };

    const StoryResource = createResource(async id => {
      ReactNoop.yield(`Started fetching story ${id}`);
      await wait(1000);
      const data = remoteData.stories[id];
      if (data === undefined) {
        throw new Error('Story not found.');
      }
      return {...data};
    });

    const UserResource = createResource(async id => {
      ReactNoop.yield(`Started fetching user ${id}`);
      await wait(100);
      const data = remoteData.users[id];
      if (data === undefined) {
        throw new Error('User not found.');
      }
      return {...data};
    });

    let cache;
    function Story(props) {
      cache = useCache();
      const story = StoryResource.read(props.id);
      const author = UserResource.read(story.authorID);
      return (
        <React.Fragment>
          <Label text={story.title} />
          <Label text={`By ${author.name}`} />
        </React.Fragment>
      );
    }

    ReactNoop.render(
      <Placeholder>
        <Story id="123" />
      </Placeholder>,
    );
    expect(ReactNoop.flush()).toEqual(['Started fetching story 123']);

    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual(['Started fetching user acdlite']);

    ReactNoop.expire(100);
    await advanceTimers(100);
    expect(ReactNoop.flush()).toEqual([
      'Why Andrew is smort',
      'By Andrew Clark',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Why Andrew is smort'),
      span('By Andrew Clark'),
    ]);

    // Simulate a remote data change
    remoteData.stories['123'].title = 'Why spelling is for losers';
    remoteData.users.acdlite.name = 'The esteemed Andrew Philip Clark';

    // Force a re-render. We should still see the old, cached ata.
    ReactNoop.render(
      <Placeholder>
        <Story key="newkey" id="123" />
      </Placeholder>,
    );
    expect(ReactNoop.flush()).toEqual([
      'Why Andrew is smort',
      'By Andrew Clark',
    ]);

    // Invalidate the cached story to trigger a refetch.
    cache.invalidate(StoryResource, '123');
    expect(ReactNoop.flush()).toEqual(['Started fetching story 123']);
    ReactNoop.expire(1000);
    await advanceTimers(1000);
    expect(ReactNoop.flush()).toEqual([
      'Why spelling is for losers',
      // The author wasn't been updated, because it wasn't invalidated
      'By Andrew Clark',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Why spelling is for losers'),
      span('By Andrew Clark'),
    ]);
  });
});
