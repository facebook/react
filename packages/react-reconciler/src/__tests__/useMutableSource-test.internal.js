/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let act;
let createMutableSource;
let useMutableSource;

function loadModules() {
  jest.resetModules();
  jest.useFakeTimers();

  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableProfilerTimer = true;

  React = require('react');
  ReactNoop = require('react-noop-renderer');
  Scheduler = require('scheduler');
  act = require('jest-react').act;

  // Stable entrypoints export with "unstable_" prefix.
  createMutableSource =
    React.createMutableSource || React.unstable_createMutableSource;
  useMutableSource = React.useMutableSource || React.unstable_useMutableSource;
}

describe('useMutableSource', () => {
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
    Scheduler.unstable_yieldValue(`${label}:${snapshot}`);
    return <div>{`${label}:${snapshot}`}</div>;
  }

  beforeEach(loadModules);

  // @gate enableUseMutableSource
  it('should subscribe to a source and schedule updates when it changes', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      ReactNoop.renderToRootWithID(
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
        </>,
        'root',
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYieldThrough([
        'a:one',
        'b:one',
        'Sync effect',
      ]);

      // Subscriptions should be passive
      expect(source.listenerCount).toBe(0);
      ReactNoop.flushPassiveEffects();
      expect(source.listenerCount).toBe(2);

      // Changing values should schedule an update with React
      source.value = 'two';
      expect(Scheduler).toFlushAndYieldThrough(['a:two', 'b:two']);

      // Unmounting a component should remove its subscription.
      ReactNoop.renderToRootWithID(
        <>
          <Component
            label="a"
            getSnapshot={defaultGetSnapshot}
            mutableSource={mutableSource}
            subscribe={defaultSubscribe}
          />
        </>,
        'root',
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:two', 'Sync effect']);
      ReactNoop.flushPassiveEffects();
      expect(source.listenerCount).toBe(1);

      // Unmounting a root should remove the remaining event listeners
      ReactNoop.unmountRootWithID('root');
      expect(Scheduler).toFlushAndYield([]);
      ReactNoop.flushPassiveEffects();
      expect(source.listenerCount).toBe(0);

      // Changes to source should not trigger an updates or warnings.
      source.value = 'three';
      expect(Scheduler).toFlushAndYield([]);
    });
  });

  // @gate enableUseMutableSource
  it('should restart work if a new source is mutated during render', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          ReactNoop.render(
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
            </>,
            () => Scheduler.unstable_yieldValue('Sync effect'),
          );
        });
      } else {
        ReactNoop.render(
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
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
      }
      // Do enough work to read from one component
      expect(Scheduler).toFlushAndYieldThrough(['a:one']);

      // Mutate source before continuing work
      source.value = 'two';

      // Render work should restart and the updated value should be used
      expect(Scheduler).toFlushAndYield(['a:two', 'b:two', 'Sync effect']);
    });
  });

  // @gate enableUseMutableSource
  it('should schedule an update if a new source is mutated between render and commit (subscription)', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      ReactNoop.render(
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
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );

      // Finish rendering
      expect(Scheduler).toFlushAndYieldThrough([
        'a:one',
        'b:one',
        'Sync effect',
      ]);

      // Mutate source before subscriptions are attached
      expect(source.listenerCount).toBe(0);
      source.value = 'two';

      // Mutation should be detected, and a new render should be scheduled
      expect(Scheduler).toFlushAndYield(['a:two', 'b:two']);
    });
  });

  // @gate enableUseMutableSource
  it('should unsubscribe and resubscribe if a new source is used', () => {
    const sourceA = createSource('a-one');
    const mutableSourceA = createMutableSource(
      sourceA,
      param => param.versionA,
    );

    const sourceB = createSource('b-one');
    const mutableSourceB = createMutableSource(
      sourceB,
      param => param.versionB,
    );

    act(() => {
      ReactNoop.render(
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSourceA}
          subscribe={defaultSubscribe}
        />,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['only:a-one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();
      expect(sourceA.listenerCount).toBe(1);

      // Changing values should schedule an update with React
      sourceA.value = 'a-two';
      expect(Scheduler).toFlushAndYield(['only:a-two']);

      // If we re-render with a new source, the old one should be unsubscribed.
      ReactNoop.render(
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSourceB}
          subscribe={defaultSubscribe}
        />,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['only:b-one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();
      expect(sourceA.listenerCount).toBe(0);
      expect(sourceB.listenerCount).toBe(1);

      // Changing to original source should not schedule updates with React
      sourceA.value = 'a-three';
      expect(Scheduler).toFlushAndYield([]);

      // Changing new source value should schedule an update with React
      sourceB.value = 'b-two';
      expect(Scheduler).toFlushAndYield(['only:b-two']);
    });
  });

  // @gate enableUseMutableSource
  it('should unsubscribe and resubscribe if a new subscribe function is provided', () => {
    const source = createSource('a-one');
    const mutableSource = createMutableSource(source, param => param.version);

    const unsubscribeA = jest.fn();
    const subscribeA = jest.fn(s => {
      const unsubscribe = defaultSubscribe(s);
      return () => {
        unsubscribe();
        unsubscribeA();
      };
    });
    const unsubscribeB = jest.fn();
    const subscribeB = jest.fn(s => {
      const unsubscribe = defaultSubscribe(s);
      return () => {
        unsubscribe();
        unsubscribeB();
      };
    });

    act(() => {
      ReactNoop.renderToRootWithID(
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={subscribeA}
        />,
        'root',
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['only:a-one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();
      expect(source.listenerCount).toBe(1);
      expect(subscribeA).toHaveBeenCalledTimes(1);

      // If we re-render with a new subscription function,
      // the old unsubscribe function should be called.
      ReactNoop.renderToRootWithID(
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={subscribeB}
        />,
        'root',
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['only:a-one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();
      expect(source.listenerCount).toBe(1);
      expect(unsubscribeA).toHaveBeenCalledTimes(1);
      expect(subscribeB).toHaveBeenCalledTimes(1);

      // Unmounting should call the newer unsubscribe.
      ReactNoop.unmountRootWithID('root');
      expect(Scheduler).toFlushAndYield([]);
      ReactNoop.flushPassiveEffects();
      expect(source.listenerCount).toBe(0);
      expect(unsubscribeB).toHaveBeenCalledTimes(1);
    });
  });

  // @gate enableUseMutableSource
  it('should re-use previously read snapshot value when reading is unsafe', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      ReactNoop.render(
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
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:one', 'b:one', 'Sync effect']);

      // Changing values should schedule an update with React.
      // Start working on this update but don't finish it.
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          source.value = 'two';
        });
      } else {
        source.value = 'two';
      }
      expect(Scheduler).toFlushAndYieldThrough(['a:two']);

      // Re-renders that occur before the update is processed
      // should reuse snapshot so long as the config has not changed
      ReactNoop.flushSync(() => {
        ReactNoop.render(
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
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
      });
      expect(Scheduler).toHaveYielded(['a:one', 'b:one', 'Sync effect']);

      expect(Scheduler).toFlushAndYield(['a:two', 'b:two']);
    });
  });

  // @gate enableUseMutableSource
  it('should read from source on newly mounted subtree if no pending updates are scheduled for source', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      ReactNoop.render(
        <>
          <Component
            label="a"
            getSnapshot={defaultGetSnapshot}
            mutableSource={mutableSource}
            subscribe={defaultSubscribe}
          />
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:one', 'Sync effect']);

      ReactNoop.render(
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
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:one', 'b:one', 'Sync effect']);
    });
  });

  // @gate enableUseMutableSource
  it('should throw and restart render if source and snapshot are unavailable during an update', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      ReactNoop.render(
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
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:one', 'b:one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();

      // Changing values should schedule an update with React.
      // Start working on this update but don't finish it.
      ReactNoop.idleUpdates(() => {
        source.value = 'two';
        expect(Scheduler).toFlushAndYieldThrough(['a:two']);
      });

      const newGetSnapshot = s => 'new:' + defaultGetSnapshot(s);

      // Force a higher priority render with a new config.
      // This should signal that the snapshot is not safe and trigger a full re-render.
      ReactNoop.flushSync(() => {
        ReactNoop.render(
          <>
            <Component
              label="a"
              getSnapshot={newGetSnapshot}
              mutableSource={mutableSource}
              subscribe={defaultSubscribe}
            />
            <Component
              label="b"
              getSnapshot={newGetSnapshot}
              mutableSource={mutableSource}
              subscribe={defaultSubscribe}
            />
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
      });
      expect(Scheduler).toHaveYielded([
        'a:new:two',
        'b:new:two',
        'Sync effect',
      ]);
    });
  });

  // @gate enableUseMutableSource
  it('should throw and restart render if source and snapshot are unavailable during a sync update', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      ReactNoop.render(
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
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:one', 'b:one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();

      // Changing values should schedule an update with React.
      // Start working on this update but don't finish it.
      ReactNoop.idleUpdates(() => {
        source.value = 'two';
        expect(Scheduler).toFlushAndYieldThrough(['a:two']);
      });

      const newGetSnapshot = s => 'new:' + defaultGetSnapshot(s);

      // Force a higher priority render with a new config.
      // This should signal that the snapshot is not safe and trigger a full re-render.
      ReactNoop.flushSync(() => {
        ReactNoop.render(
          <>
            <Component
              label="a"
              getSnapshot={newGetSnapshot}
              mutableSource={mutableSource}
              subscribe={defaultSubscribe}
            />
            <Component
              label="b"
              getSnapshot={newGetSnapshot}
              mutableSource={mutableSource}
              subscribe={defaultSubscribe}
            />
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
      });
      expect(Scheduler).toHaveYielded([
        'a:new:two',
        'b:new:two',
        'Sync effect',
      ]);
    });
  });

  // @gate enableUseMutableSource
  it('should only update components whose subscriptions fire', () => {
    const source = createComplexSource('a:one', 'b:one');
    const mutableSource = createMutableSource(source, param => param.version);

    // Subscribe to part of the store.
    const getSnapshotA = s => s.valueA;
    const subscribeA = (s, callback) => s.subscribeA(callback);
    const getSnapshotB = s => s.valueB;
    const subscribeB = (s, callback) => s.subscribeB(callback);

    act(() => {
      ReactNoop.render(
        <>
          <Component
            label="a"
            getSnapshot={getSnapshotA}
            mutableSource={mutableSource}
            subscribe={subscribeA}
          />
          <Component
            label="b"
            getSnapshot={getSnapshotB}
            mutableSource={mutableSource}
            subscribe={subscribeB}
          />
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:a:one', 'b:b:one', 'Sync effect']);

      // Changes to part of the store (e.g. A) should not render other parts.
      source.valueA = 'a:two';
      expect(Scheduler).toFlushAndYield(['a:a:two']);
      source.valueB = 'b:two';
      expect(Scheduler).toFlushAndYield(['b:b:two']);
    });
  });

  // @gate enableUseMutableSource
  it('should detect tearing in part of the store not yet subscribed to', () => {
    const source = createComplexSource('a:one', 'b:one');
    const mutableSource = createMutableSource(source, param => param.version);

    // Subscribe to part of the store.
    const getSnapshotA = s => s.valueA;
    const subscribeA = (s, callback) => s.subscribeA(callback);
    const getSnapshotB = s => s.valueB;
    const subscribeB = (s, callback) => s.subscribeB(callback);

    act(() => {
      ReactNoop.render(
        <>
          <Component
            label="a"
            getSnapshot={getSnapshotA}
            mutableSource={mutableSource}
            subscribe={subscribeA}
          />
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:a:one', 'Sync effect']);

      // Because the store has not changed yet, there are no pending updates,
      // so it is considered safe to read from when we start this render.
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          ReactNoop.render(
            <>
              <Component
                label="a"
                getSnapshot={getSnapshotA}
                mutableSource={mutableSource}
                subscribe={subscribeA}
              />
              <Component
                label="b"
                getSnapshot={getSnapshotB}
                mutableSource={mutableSource}
                subscribe={subscribeB}
              />
              <Component
                label="c"
                getSnapshot={getSnapshotB}
                mutableSource={mutableSource}
                subscribe={subscribeB}
              />
            </>,
            () => Scheduler.unstable_yieldValue('Sync effect'),
          );
        });
      } else {
        ReactNoop.render(
          <>
            <Component
              label="a"
              getSnapshot={getSnapshotA}
              mutableSource={mutableSource}
              subscribe={subscribeA}
            />
            <Component
              label="b"
              getSnapshot={getSnapshotB}
              mutableSource={mutableSource}
              subscribe={subscribeB}
            />
            <Component
              label="c"
              getSnapshot={getSnapshotB}
              mutableSource={mutableSource}
              subscribe={subscribeB}
            />
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
      }
      expect(Scheduler).toFlushAndYieldThrough(['a:a:one', 'b:b:one']);

      // Mutating the source should trigger a tear detection on the next read,
      // which should throw and re-render the entire tree.
      source.valueB = 'b:two';

      expect(Scheduler).toFlushAndYield([
        'a:a:one',
        'b:b:two',
        'c:b:two',
        'Sync effect',
      ]);
    });
  });

  // @gate enableUseMutableSource
  it('does not schedule an update for subscriptions that fire with an unchanged snapshot', () => {
    const MockComponent = jest.fn(Component);

    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      ReactNoop.render(
        <MockComponent
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYieldThrough(['only:one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();
      expect(source.listenerCount).toBe(1);

      // Notify subscribe function but don't change the value
      source.value = 'one';
      expect(Scheduler).toFlushWithoutYielding();
    });
  });

  // @gate enableUseMutableSource
  it('should throw and restart if getSnapshot changes between scheduled update and re-render', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    const newGetSnapshot = s => 'new:' + defaultGetSnapshot(s);

    let updateGetSnapshot;

    function WrapperWithState() {
      const tuple = React.useState(() => defaultGetSnapshot);
      updateGetSnapshot = tuple[1];
      return (
        <Component
          label="only"
          getSnapshot={tuple[0]}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    act(() => {
      ReactNoop.render(<WrapperWithState />, () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['only:one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();

      // Change the source (and schedule an update).
      source.value = 'two';

      // Schedule a higher priority update that changes getSnapshot.
      ReactNoop.flushSync(() => {
        updateGetSnapshot(() => newGetSnapshot);
      });

      expect(Scheduler).toHaveYielded(['only:new:two']);
    });
  });

  // @gate enableUseMutableSource
  it('should recover from a mutation during yield when other work is scheduled', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    act(() => {
      // Start a render that uses the mutable source.
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          ReactNoop.render(
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
            </>,
          );
        });
      } else {
        ReactNoop.render(
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
          </>,
        );
      }
      expect(Scheduler).toFlushAndYieldThrough(['a:one']);

      // Mutate source
      source.value = 'two';

      // Now render something different.
      ReactNoop.render(<div />);
      expect(Scheduler).toFlushAndYield([]);
    });
  });

  // @gate enableUseMutableSource
  it('should not throw if the new getSnapshot returns the same snapshot value', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    const onRenderA = jest.fn();
    const onRenderB = jest.fn();

    let updateGetSnapshot;

    function WrapperWithState() {
      const tuple = React.useState(() => defaultGetSnapshot);
      updateGetSnapshot = tuple[1];
      return (
        <Component
          label="b"
          getSnapshot={tuple[0]}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    act(() => {
      ReactNoop.render(
        <>
          <React.Profiler id="a" onRender={onRenderA}>
            <Component
              label="a"
              getSnapshot={defaultGetSnapshot}
              mutableSource={mutableSource}
              subscribe={defaultSubscribe}
            />
          </React.Profiler>
          <React.Profiler id="b" onRender={onRenderB}>
            <WrapperWithState />
          </React.Profiler>
        </>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['a:one', 'b:one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();
      expect(onRenderA).toHaveBeenCalledTimes(1);
      expect(onRenderB).toHaveBeenCalledTimes(1);

      // If B's getSnapshot function updates, but the snapshot it returns is the same,
      // only B should re-render (to update its state).
      updateGetSnapshot(() => s => defaultGetSnapshot(s));
      expect(Scheduler).toFlushAndYield(['b:one']);
      ReactNoop.flushPassiveEffects();
      expect(onRenderA).toHaveBeenCalledTimes(1);
      expect(onRenderB).toHaveBeenCalledTimes(2);
    });
  });

  // @gate enableUseMutableSource
  it('should not throw if getSnapshot changes but the source can be safely read from anyway', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    const newGetSnapshot = s => 'new:' + defaultGetSnapshot(s);

    let updateGetSnapshot;

    function WrapperWithState() {
      const tuple = React.useState(() => defaultGetSnapshot);
      updateGetSnapshot = tuple[1];
      return (
        <Component
          label="only"
          getSnapshot={tuple[0]}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    act(() => {
      ReactNoop.render(<WrapperWithState />, () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['only:one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();

      // Change the source (and schedule an update)
      // but also change the snapshot function too.
      ReactNoop.batchedUpdates(() => {
        source.value = 'two';
        updateGetSnapshot(() => newGetSnapshot);
      });

      expect(Scheduler).toFlushAndYield(['only:new:two']);
    });
  });

  // @gate enableUseMutableSource
  it('should still schedule an update if an eager selector throws after a mutation', () => {
    const source = createSource({
      friends: [
        {id: 1, name: 'Foo'},
        {id: 2, name: 'Bar'},
      ],
    });
    const mutableSource = createMutableSource(source, param => param.version);

    function FriendsList() {
      const getSnapshot = React.useCallback(
        ({value}) => Array.from(value.friends),
        [],
      );
      const friends = useMutableSource(
        mutableSource,
        getSnapshot,
        defaultSubscribe,
      );
      return (
        <ul>
          {friends.map(friend => (
            <Friend key={friend.id} id={friend.id} />
          ))}
        </ul>
      );
    }

    function Friend({id}) {
      const getSnapshot = React.useCallback(
        ({value}) => {
          // This selector is intentionally written in a way that will throw
          // if no matching friend exists in the store.
          return value.friends.find(friend => friend.id === id).name;
        },
        [id],
      );
      const name = useMutableSource(
        mutableSource,
        getSnapshot,
        defaultSubscribe,
      );
      Scheduler.unstable_yieldValue(`${id}:${name}`);
      return <li>{name}</li>;
    }

    act(() => {
      ReactNoop.render(<FriendsList />, () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['1:Foo', '2:Bar', 'Sync effect']);

      // This mutation will cause the "Bar" component to throw,
      // since its value will no longer be a part of the store.
      // Mutable source should still schedule an update though,
      // which should unmount "Bar" and mount "Baz".
      source.value = {
        friends: [
          {id: 1, name: 'Foo'},
          {id: 3, name: 'Baz'},
        ],
      };
      expect(Scheduler).toFlushAndYield(['1:Foo', '3:Baz']);
    });
  });

  // @gate enableUseMutableSource
  it('should not warn about updates that fire between unmount and passive unsubscribe', () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    function Wrapper() {
      React.useLayoutEffect(() => () => {
        Scheduler.unstable_yieldValue('layout unmount');
      });
      return (
        <Component
          label="only"
          getSnapshot={defaultGetSnapshot}
          mutableSource={mutableSource}
          subscribe={defaultSubscribe}
        />
      );
    }

    act(() => {
      ReactNoop.renderToRootWithID(<Wrapper />, 'root', () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYield(['only:one', 'Sync effect']);
      ReactNoop.flushPassiveEffects();

      // Unmounting a root should remove the remaining event listeners in a passive effect
      ReactNoop.unmountRootWithID('root');
      expect(Scheduler).toFlushAndYieldThrough(['layout unmount']);

      // Changes to source should not cause a warning,
      // even though the unsubscribe hasn't run yet (since it's a pending passive effect).
      source.value = 'two';
      expect(Scheduler).toFlushAndYield([]);
    });
  });

  // @gate enableUseMutableSource
  it('should support inline selectors and updates that are processed after selector change', async () => {
    const source = createSource({
      a: 'initial',
      b: 'initial',
    });
    const mutableSource = createMutableSource(source, param => param.version);

    const getSnapshotA = () => source.value.a;
    const getSnapshotB = () => source.value.b;

    function mutateB(newB) {
      source.value = {
        ...source.value,
        b: newB,
      };
    }

    function App({getSnapshot}) {
      const state = useMutableSource(
        mutableSource,
        getSnapshot,
        defaultSubscribe,
      );
      return state;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App getSnapshot={getSnapshotA} />);
    });
    expect(root).toMatchRenderedOutput('initial');

    await act(async () => {
      mutateB('Updated B');
      root.render(<App getSnapshot={getSnapshotB} />);
    });
    expect(root).toMatchRenderedOutput('Updated B');

    await act(async () => {
      mutateB('Another update');
    });
    expect(root).toMatchRenderedOutput('Another update');
  });

  // @gate enableUseMutableSource
  it('should clear the update queue when getSnapshot changes with pending lower priority updates', async () => {
    const source = createSource({
      a: 'initial',
      b: 'initial',
    });
    const mutableSource = createMutableSource(source, param => param.version);

    const getSnapshotA = () => source.value.a;
    const getSnapshotB = () => source.value.b;

    function mutateA(newA) {
      source.value = {
        ...source.value,
        a: newA,
      };
    }

    function mutateB(newB) {
      source.value = {
        ...source.value,
        b: newB,
      };
    }

    function App({toggle}) {
      const state = useMutableSource(
        mutableSource,
        toggle ? getSnapshotB : getSnapshotA,
        defaultSubscribe,
      );
      const result = (toggle ? 'B: ' : 'A: ') + state;
      return result;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App toggle={false} />);
    });
    expect(root).toMatchRenderedOutput('A: initial');

    await act(async () => {
      ReactNoop.discreteUpdates(() => {
        // Update both A and B to the same value
        mutateA('Update');
        mutateB('Update');
        // Toggle to B in the same batch
        root.render(<App toggle={true} />);
      });
      // Mutate A at lower priority. This should never be rendered, because
      // by the time we get to the lower priority, we've already switched
      // to B.
      mutateA('OOPS! This mutation should be ignored');
    });
    expect(root).toMatchRenderedOutput('B: Update');
  });

  // @gate enableUseMutableSource
  it('should clear the update queue when source changes with pending lower priority updates', async () => {
    const sourceA = createSource('initial');
    const sourceB = createSource('initial');
    const mutableSourceA = createMutableSource(
      sourceA,
      param => param.versionA,
    );
    const mutableSourceB = createMutableSource(
      sourceB,
      param => param.versionB,
    );

    function App({toggle}) {
      const state = useMutableSource(
        toggle ? mutableSourceB : mutableSourceA,
        defaultGetSnapshot,
        defaultSubscribe,
      );
      const result = (toggle ? 'B: ' : 'A: ') + state;
      return result;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App toggle={false} />);
    });
    expect(root).toMatchRenderedOutput('A: initial');

    await act(async () => {
      ReactNoop.discreteUpdates(() => {
        // Update both A and B to the same value
        sourceA.value = 'Update';
        sourceB.value = 'Update';
        // Toggle to B in the same batch
        root.render(<App toggle={true} />);
      });
      // Mutate A at lower priority. This should never be rendered, because
      // by the time we get to the lower priority, we've already switched
      // to B.
      sourceA.value = 'OOPS! This mutation should be ignored';
    });
    expect(root).toMatchRenderedOutput('B: Update');
  });

  // @gate enableUseMutableSource
  it('should always treat reading as potentially unsafe when getSnapshot changes between renders', async () => {
    const source = createSource({
      a: 'foo',
      b: 'bar',
    });
    const mutableSource = createMutableSource(source, param => param.version);

    const getSnapshotA = () => source.value.a;
    const getSnapshotB = () => source.value.b;

    function mutateA(newA) {
      source.value = {
        ...source.value,
        a: newA,
      };
    }

    function App({getSnapshotFirst, getSnapshotSecond}) {
      const first = useMutableSource(
        mutableSource,
        getSnapshotFirst,
        defaultSubscribe,
      );
      const second = useMutableSource(
        mutableSource,
        getSnapshotSecond,
        defaultSubscribe,
      );

      let result = `x: ${first}, y: ${second}`;

      if (getSnapshotFirst === getSnapshotSecond) {
        // When both getSnapshot functions are equal,
        // the two values must be consistent.
        if (first !== second) {
          result = 'Oops, tearing!';
        }
      }

      React.useEffect(() => {
        Scheduler.unstable_yieldValue(result);
      }, [result]);

      return result;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <App
          getSnapshotFirst={getSnapshotA}
          getSnapshotSecond={getSnapshotB}
        />,
      );
    });
    // x and y start out reading from different parts of the store.
    expect(Scheduler).toHaveYielded(['x: foo, y: bar']);

    await act(async () => {
      ReactNoop.discreteUpdates(() => {
        // At high priority, toggle y so that it reads from A instead of B.
        // Simultaneously, mutate A.
        mutateA('baz');
        root.render(
          <App
            getSnapshotFirst={getSnapshotA}
            getSnapshotSecond={getSnapshotA}
          />,
        );

        // If this update were processed before the next mutation,
        // it would be expected to yield "baz" and "baz".
      });

      // At lower priority, mutate A again.
      // This happens to match the initial value of B.
      mutateA('bar');

      // When this update is processed,
      // it is expected to yield "bar" and "bar".
    });

    // Check that we didn't commit any inconsistent states.
    // The actual sequence of work will be:
    // 1. React renders the high-pri update, sees a new getSnapshot, detects the source has been further mutated, and throws
    // 2. React re-renders with all pending updates, including the second mutation, and renders "bar" and "bar".
    expect(Scheduler).toHaveYielded(['x: bar, y: bar']);
  });

  // @gate enableUseMutableSource
  it('getSnapshot changes and then source is mutated in between paint and passive effect phase', async () => {
    const source = createSource({
      a: 'foo',
      b: 'bar',
    });
    const mutableSource = createMutableSource(source, param => param.version);

    function mutateB(newB) {
      source.value = {
        ...source.value,
        b: newB,
      };
    }

    const getSnapshotA = () => source.value.a;
    const getSnapshotB = () => source.value.b;

    function App({getSnapshot}) {
      const value = useMutableSource(
        mutableSource,
        getSnapshot,
        defaultSubscribe,
      );

      Scheduler.unstable_yieldValue('Render: ' + value);
      React.useEffect(() => {
        Scheduler.unstable_yieldValue('Commit: ' + value);
      }, [value]);

      return value;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App getSnapshot={getSnapshotA} />);
    });
    expect(Scheduler).toHaveYielded(['Render: foo', 'Commit: foo']);

    await act(async () => {
      // Switch getSnapshot to read from B instead
      root.render(<App getSnapshot={getSnapshotB} />);
      // Render and finish the tree, but yield right after paint, before
      // the passive effects have fired.
      expect(Scheduler).toFlushUntilNextPaint(['Render: bar']);
      // Then mutate B.
      mutateB('baz');
    });
    expect(Scheduler).toHaveYielded([
      // Fires the effect from the previous render
      'Commit: bar',
      // During that effect, it should detect that the snapshot has changed
      // and re-render.
      'Render: baz',
      'Commit: baz',
    ]);
    expect(root).toMatchRenderedOutput('baz');
  });

  // @gate enableUseMutableSource
  it('getSnapshot changes and then source is mutated in between paint and passive effect phase, case 2', async () => {
    const source = createSource({
      a: 'a0',
      b: 'b0',
    });
    const mutableSource = createMutableSource(source, param => param.version);

    const getSnapshotA = () => source.value.a;
    const getSnapshotB = () => source.value.b;

    function mutateA(newA) {
      source.value = {
        ...source.value,
        a: newA,
      };
    }

    function App({getSnapshotFirst, getSnapshotSecond}) {
      const first = useMutableSource(
        mutableSource,
        getSnapshotFirst,
        defaultSubscribe,
      );
      const second = useMutableSource(
        mutableSource,
        getSnapshotSecond,
        defaultSubscribe,
      );

      return `first: ${first}, second: ${second}`;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <App
          getSnapshotFirst={getSnapshotA}
          getSnapshotSecond={getSnapshotB}
        />,
      );
    });
    expect(root.getChildrenAsJSX()).toEqual('first: a0, second: b0');

    await act(async () => {
      // Switch the second getSnapshot to also read from A
      root.render(
        <App
          getSnapshotFirst={getSnapshotA}
          getSnapshotSecond={getSnapshotA}
        />,
      );
      // Render and finish the tree, but yield right after paint, before
      // the passive effects have fired.
      expect(Scheduler).toFlushUntilNextPaint([]);

      // Now mutate A. Both hooks should update.
      // This is at high priority so that it doesn't get batched with default
      // priority updates that might fire during the passive effect
      await act(async () => {
        ReactNoop.discreteUpdates(() => {
          mutateA('a1');
        });
      });

      expect(root).toMatchRenderedOutput('first: a1, second: a1');
    });

    expect(root.getChildrenAsJSX()).toEqual('first: a1, second: a1');
  });

  // @gate enableUseMutableSource
  it(
    'if source is mutated after initial read but before subscription is set ' +
      'up, should still entangle all pending mutations even if snapshot of ' +
      'new subscription happens to match',
    async () => {
      const source = createSource({
        a: 'a0',
        b: 'b0',
      });
      const mutableSource = createMutableSource(source, param => param.version);

      const getSnapshotA = () => source.value.a;
      const getSnapshotB = () => source.value.b;

      function mutateA(newA) {
        source.value = {
          ...source.value,
          a: newA,
        };
      }

      function mutateB(newB) {
        source.value = {
          ...source.value,
          b: newB,
        };
      }

      function Read({getSnapshot}) {
        const value = useMutableSource(
          mutableSource,
          getSnapshot,
          defaultSubscribe,
        );
        Scheduler.unstable_yieldValue(value);
        return value;
      }

      function Text({text}) {
        Scheduler.unstable_yieldValue(text);
        return text;
      }

      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(
          <>
            <Read getSnapshot={getSnapshotA} />
          </>,
        );
      });
      expect(Scheduler).toHaveYielded(['a0']);
      expect(root).toMatchRenderedOutput('a0');

      await act(async () => {
        if (gate(flags => flags.enableSyncDefaultUpdates)) {
          React.startTransition(() => {
            root.render(
              <>
                <Read getSnapshot={getSnapshotA} />
                <Read getSnapshot={getSnapshotB} />
                <Text text="c" />
              </>,
            );
          });
        } else {
          root.render(
            <>
              <Read getSnapshot={getSnapshotA} />
              <Read getSnapshot={getSnapshotB} />
              <Text text="c" />
            </>,
          );
        }

        expect(Scheduler).toFlushAndYieldThrough(['a0', 'b0']);
        // Mutate in an event. This schedules a subscription update on a, which
        // already mounted, but not b, which hasn't subscribed yet.
        mutateA('a1');
        mutateB('b1');

        // Mutate again at lower priority. This will schedule another subscription
        // update on a, but not b. When b mounts and subscriptions, the value it
        // read during render will happen to match the latest value. But it should
        // still entangle the updates to prevent the previous update (a1) from
        // rendering by itself.
        React.startTransition(() => {
          mutateA('a0');
          mutateB('b0');
        });
        // Finish the current render
        expect(Scheduler).toFlushUntilNextPaint(['c']);
        // a0 will re-render because of the mutation update. But it should show
        // the latest value, not the intermediate one, to avoid tearing with b.
        expect(Scheduler).toFlushUntilNextPaint(['a0']);

        expect(root).toMatchRenderedOutput('a0b0c');
        // We should be done.
        expect(Scheduler).toFlushAndYield([]);
        expect(root).toMatchRenderedOutput('a0b0c');
      });
    },
  );

  // @gate enableUseMutableSource
  it('warns about functions being used as snapshot values', async () => {
    const source = createSource(() => 'a');
    const mutableSource = createMutableSource(source, param => param.version);

    const getSnapshot = () => source.value;

    function Read() {
      const fn = useMutableSource(mutableSource, getSnapshot, defaultSubscribe);
      const value = fn();
      Scheduler.unstable_yieldValue(value);
      return value;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <>
          <Read />
        </>,
      );
      expect(() => expect(Scheduler).toFlushAndYield(['a'])).toErrorDev(
        'Mutable source should not return a function as the snapshot value.',
      );
    });
    expect(root).toMatchRenderedOutput('a');
  });

  // @gate enableUseMutableSource
  it('getSnapshot changes and then source is mutated during interleaved event', async () => {
    const {useEffect} = React;

    const source = createComplexSource('1', '2');
    const mutableSource = createMutableSource(source, param => param.version);

    // Subscribe to part of the store.
    const getSnapshotA = s => s.valueA;
    const subscribeA = (s, callback) => s.subscribeA(callback);
    const configA = [getSnapshotA, subscribeA];

    const getSnapshotB = s => s.valueB;
    const subscribeB = (s, callback) => s.subscribeB(callback);
    const configB = [getSnapshotB, subscribeB];

    function App({parentConfig, childConfig}) {
      const [getSnapshot, subscribe] = parentConfig;
      const parentValue = useMutableSource(
        mutableSource,
        getSnapshot,
        subscribe,
      );

      Scheduler.unstable_yieldValue('Parent: ' + parentValue);

      return (
        <Child
          parentConfig={parentConfig}
          childConfig={childConfig}
          parentValue={parentValue}
        />
      );
    }

    function Child({parentConfig, childConfig, parentValue}) {
      const [getSnapshot, subscribe] = childConfig;
      const childValue = useMutableSource(
        mutableSource,
        getSnapshot,
        subscribe,
      );

      Scheduler.unstable_yieldValue('Child: ' + childValue);

      let result = `${parentValue}, ${childValue}`;

      if (parentConfig === childConfig) {
        // When both components read using the same config, the two values
        // must be consistent.
        if (parentValue !== childValue) {
          result = 'Oops, tearing!';
        }
      }

      useEffect(() => {
        Scheduler.unstable_yieldValue('Commit: ' + result);
      }, [result]);

      return result;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App parentConfig={configA} childConfig={configB} />);
    });
    expect(Scheduler).toHaveYielded(['Parent: 1', 'Child: 2', 'Commit: 1, 2']);

    await act(async () => {
      // Switch the parent and the child to read using the same config
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          root.render(<App parentConfig={configB} childConfig={configB} />);
        });
      } else {
        root.render(<App parentConfig={configB} childConfig={configB} />);
      }
      // Start rendering the parent, but yield before rendering the child
      expect(Scheduler).toFlushAndYieldThrough(['Parent: 2']);

      // Mutate the config. This is at lower priority so that 1) to make sure
      // it doesn't happen to get batched with the in-progress render, and 2)
      // so it doesn't interrupt the in-progress render.
      React.startTransition(() => {
        source.valueB = '3';
      });

      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        // In default sync mode, all of the updates flush sync.
        expect(Scheduler).toFlushAndYieldThrough([
          // The partial render completes
          'Child: 2',
          'Commit: 2, 2',
          'Parent: 3',
          'Child: 3',
        ]);

        expect(Scheduler).toFlushAndYield([
          // Now finish the rest of the update
          'Commit: 3, 3',
        ]);
      } else {
        expect(Scheduler).toFlushAndYieldThrough([
          // The partial render completes
          'Child: 2',
          'Commit: 2, 2',
        ]);

        // Now there are two pending mutations at different priorities. But they
        // both read the same version of the mutable source, so we must render
        // them simultaneously.
        //
        expect(Scheduler).toFlushAndYieldThrough([
          'Parent: 3',
          // Demonstrates that we can yield here
        ]);
        expect(Scheduler).toFlushAndYield([
          // Now finish the rest of the update
          'Child: 3',
          'Commit: 3, 3',
        ]);
      }
    });
  });

  // @gate enableUseMutableSource
  it('should not tear with newly mounted component when updates were scheduled at a lower priority', async () => {
    const source = createSource('one');
    const mutableSource = createMutableSource(source, param => param.version);

    let committedA = null;
    let committedB = null;

    const onRender = () => {
      if (committedB !== null) {
        expect(committedA).toBe(committedB);
      }
    };

    function ComponentA() {
      const snapshot = useMutableSource(
        mutableSource,
        defaultGetSnapshot,
        defaultSubscribe,
      );
      Scheduler.unstable_yieldValue(`a:${snapshot}`);
      React.useEffect(() => {
        committedA = snapshot;
      }, [snapshot]);
      return <div>{`a:${snapshot}`}</div>;
    }
    function ComponentB() {
      const snapshot = useMutableSource(
        mutableSource,
        defaultGetSnapshot,
        defaultSubscribe,
      );
      Scheduler.unstable_yieldValue(`b:${snapshot}`);
      React.useEffect(() => {
        committedB = snapshot;
      }, [snapshot]);
      return <div>{`b:${snapshot}`}</div>;
    }

    // Mount ComponentA with data version 1
    act(() => {
      ReactNoop.render(
        <React.Profiler id="root" onRender={onRender}>
          <ComponentA />
        </React.Profiler>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
    });
    expect(Scheduler).toHaveYielded(['a:one', 'Sync effect']);
    expect(source.listenerCount).toBe(1);

    // Mount ComponentB with version 1 (but don't commit it)
    act(() => {
      ReactNoop.render(
        <React.Profiler id="root" onRender={onRender}>
          <ComponentA />
          <ComponentB />
        </React.Profiler>,
        () => Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYieldThrough([
        'a:one',
        'b:one',
        'Sync effect',
      ]);
      expect(source.listenerCount).toBe(1);

      // Mutate -> schedule update for ComponentA
      React.startTransition(() => {
        source.value = 'two';
      });

      // Commit ComponentB -> notice the change and schedule an update for ComponentB
      expect(Scheduler).toFlushAndYield(['a:two', 'b:two']);
      expect(source.listenerCount).toBe(2);
    });
  });

  if (__DEV__) {
    describe('dev warnings', () => {
      // @gate enableUseMutableSource
      it('should warn if the subscribe function does not return an unsubscribe function', () => {
        const source = createSource('one');
        const mutableSource = createMutableSource(
          source,
          param => param.version,
        );

        const brokenSubscribe = () => {};

        expect(() => {
          act(() => {
            ReactNoop.render(
              <Component
                label="only"
                getSnapshot={defaultGetSnapshot}
                mutableSource={mutableSource}
                subscribe={brokenSubscribe}
              />,
            );
          });
        }).toErrorDev(
          'Mutable source subscribe function must return an unsubscribe function.',
        );
      });

      // @gate enableUseMutableSource
      it('should error if multiple renderers of the same type use a mutable source at the same time', () => {
        const source = createSource('one');
        const mutableSource = createMutableSource(
          source,
          param => param.version,
        );

        act(() => {
          // Start a render that uses the mutable source.
          if (gate(flags => flags.enableSyncDefaultUpdates)) {
            React.startTransition(() => {
              ReactNoop.render(
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
                </>,
              );
            });
          } else {
            ReactNoop.render(
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
              </>,
            );
          }
          expect(Scheduler).toFlushAndYieldThrough(['a:one']);

          const PrevScheduler = Scheduler;

          // Get a new copy of ReactNoop.
          loadModules();

          spyOnDev(console, 'error');

          // Use the mutablesource again but with a different renderer.
          ReactNoop.render(
            <Component
              label="c"
              getSnapshot={defaultGetSnapshot}
              mutableSource={mutableSource}
              subscribe={defaultSubscribe}
            />,
          );
          expect(Scheduler).toFlushAndYieldThrough(['c:one']);

          expect(console.error.calls.argsFor(0)[0]).toContain(
            'Detected multiple renderers concurrently rendering the ' +
              'same mutable source. This is currently unsupported.',
          );

          // TODO (useMutableSource) Act will automatically flush remaining work from render 1,
          // but at this point something in the hooks dispatcher has been broken by jest.resetModules()
          // Figure out what this is and remove this catch.
          expect(() =>
            PrevScheduler.unstable_flushAllWithoutAsserting(),
          ).toThrow('Invalid hook call');
        });
      });

      // @gate enableUseMutableSource
      it('should error if multiple renderers of the same type use a mutable source at the same time with mutation between', () => {
        const source = createSource('one');
        const mutableSource = createMutableSource(
          source,
          param => param.version,
        );

        act(() => {
          // Start a render that uses the mutable source.
          if (gate(flags => flags.enableSyncDefaultUpdates)) {
            React.startTransition(() => {
              ReactNoop.render(
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
                </>,
              );
            });
          } else {
            ReactNoop.render(
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
              </>,
            );
          }
          expect(Scheduler).toFlushAndYieldThrough(['a:one']);

          const PrevScheduler = Scheduler;

          // Get a new copy of ReactNoop.
          loadModules();

          spyOnDev(console, 'error');

          // Mutate before the new render reads from the source.
          source.value = 'two';

          // Use the mutablesource again but with a different renderer.
          ReactNoop.render(
            <Component
              label="c"
              getSnapshot={defaultGetSnapshot}
              mutableSource={mutableSource}
              subscribe={defaultSubscribe}
            />,
          );
          expect(Scheduler).toFlushAndYieldThrough(['c:two']);

          expect(console.error.calls.argsFor(0)[0]).toContain(
            'Detected multiple renderers concurrently rendering the ' +
              'same mutable source. This is currently unsupported.',
          );

          // TODO (useMutableSource) Act will automatically flush remaining work from render 1,
          // but at this point something in the hooks dispatcher has been broken by jest.resetModules()
          // Figure out what this is and remove this catch.
          expect(() =>
            PrevScheduler.unstable_flushAllWithoutAsserting(),
          ).toThrow('Invalid hook call');
        });
      });
    });
  }
});
