/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

const {test} = require('jest-snapshot-serializer-raw');

let React;
let ReactNoop;
let Scheduler;
let act;

let getCacheForType;
let useState;
let useTransition;
let Suspense;
let TracingMarker;
let startTransition;

let caches;
let seededCache;

let transitionCallbacks;

let onTransitionStart;
let onTransitionProgress;
let onTransitionIncomplete;
let onTransitionComplete;

let onMarkerProgress;
let onMarkerIncomplete;
let onMarkerComplete;

describe('ReactInteractionTracing', () => {
  beforeEach(() => {
    jest.resetModules();
    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableTransitionTracing = true;

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    act = require('jest-react').act;

    useState = React.useState;
    useTransition = React.useTransition;
    startTransition = React.startTransition;
    Suspense = React.Suspense;
    TracingMarker = React.unstable_TracingMarker;

    getCacheForType = React.unstable_getCacheForType;

    caches = [];
    seededCache = null;

    onTransitionStart = jest.fn();
    onTransitionProgress = jest.fn();
    onTransitionIncomplete = jest.fn();
    onTransitionComplete = jest.fn();

    onMarkerProgress = jest.fn();
    onMarkerIncomplete = jest.fn();
    onMarkerComplete = jest.fn();

    transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        onTransitionStart({name, startTime});
      },
      onTransitionProgress: (name, startTime, currentTime, pending) => {
        onTransitionProgress({
          name,
          startTime,
          currentTime,
          pending,
        });
      },
      onTransitionIncomplete: (name, startTime, deletions) => {
        onTransitionIncomplete({
          name,
          startTime,
          deletions,
        });
      },
      onTransitionComplete: (name, startTime, endTime) => {
        onTransitionComplete({
          name,
          startTime,
          endTime,
        });
      },
      onMarkerProgress: (name, marker, startTime, currentTime, pending) => {
        onMarkerProgress({
          name,
          marker,
          startTime,
          currentTime,
          pending,
        });
      },
      onMarkerIncomplete: (name, marker, startTime, deletions) => {
        onMarkerIncomplete({
          name,
          marker,
          startTime,
          deletions,
        });
      },
      onMarkerComplete: (name, marker, startTime, endTime) => {
        onMarkerComplete({
          name,
          marker,
          startTime,
          endTime,
        });
      },
    };
  });

  function createTextCache() {
    if (seededCache !== null) {
      const cache = seededCache;
      seededCache = null;
      return cache;
    }

    const data = new Map();
    const cache = {
      data,
      resolve(text) {
        const record = data.get(text);

        if (record === undefined) {
          const newRecord = {
            status: 'resolved',
            value: text,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'resolved';
          record.value = text;
          thenable.pings.forEach(t => t());
        }
      },
      reject(text, error) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'rejected',
            value: error,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'rejected';
          record.value = error;
          thenable.pings.forEach(t => t());
        }
      },
    };
    caches.push(cache);
    return cache;
  }

  function readText(text) {
    const textCache = getCacheForType(createTextCache);
    const record = textCache.data.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.unstable_yieldValue(`Suspend [${text}]`);
          throw record.value;
        case 'rejected':
          Scheduler.unstable_yieldValue(`Error [${text}]`);
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.unstable_yieldValue(`Suspend [${text}]`);

      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.data.set(text, newRecord);

      throw thenable;
    }
  }

  function AsyncText({text}) {
    const fullText = readText(text);
    Scheduler.unstable_yieldValue(fullText);
    return fullText;
  }

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function seedNextTextCache(text) {
    if (seededCache === null) {
      seededCache = createTextCache();
    }
    seededCache.resolve(text);
  }

  function resolveMostRecentTextCache(text) {
    if (caches.length === 0) {
      throw Error('Cache does not exist');
    } else {
      // Resolve the most recently created cache. An older cache can by
      // resolved with `caches[index].resolve(text)`.
      caches[caches.length - 1].resolve(text);
    }
  }

  const resolveText = resolveMostRecentTextCache;

  function rejectMostRecentTextCache(text, error) {
    if (caches.length === 0) {
      throw Error('Cache does not exist.');
    } else {
      // Resolve the most recently created cache. An older cache can by
      // resolved with `caches[index].reject(text, error)`.
      caches[caches.length - 1].reject(text, error);
    }
  }

  const rejectText = rejectMostRecentTextCache;

  function advanceTimers(ms) {
    // Note: This advances Jest's virtual time but not React's. Use
    // ReactNoop.expire for that.
    if (typeof ms !== 'number') {
      throw new Error('Must specify ms');
    }
    jest.advanceTimersByTime(ms);
    // Wait until the end of the current tick
    // We cannot use a timer since we're faking them
    return Promise.resolve().then(() => {});
  }

  it('should correctly trace interactions for async roots', async () => {
    let navigateToPageTwo;
    function App() {
      const [navigate, setNavigate] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      return (
        <div>
          {navigate ? (
            <TracingMarker name={'page loaded'}>
              <Suspense
                fallback={<Text text="Loading..." />}
                name="suspense page">
                <AsyncText text="Page Two" />
              </Suspense>
            </TracingMarker>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({transitionCallbacks});
    await act(async () => {
      root.render(<App />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One']);
    });

    await act(async () => {
      startTransition(() => navigateToPageTwo(), {name: 'page transition'});

      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Suspend [Page Two]', 'Loading...']);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Page Two');

      expect(Scheduler).toFlushAndYield(['Page Two']);
    });

    expect(onTransitionStart).toHaveBeenCalledTimes(1);
    expect(onTransitionStart.mock.calls[0][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
    });

    expect(onTransitionProgress).toHaveBeenCalledTimes(2);
    expect(onTransitionProgress.mock.calls[0][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
      currentTime: 2000,
      pending: [{name: 'suspense page'}],
    });
    expect(onTransitionProgress.mock.calls[1][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
      currentTime: 3000,
      pending: [],
    });

    expect(onMarkerProgress).toHaveBeenCalledTimes(2);
    expect(onMarkerProgress.mock.calls[0][0]).toEqual({
      name: 'page transition',
      marker: 'page loaded',
      startTime: 1000,
      currentTime: 2000,
      pending: [{name: 'suspense page'}],
    });
    expect(onMarkerProgress.mock.calls[1][0]).toEqual({
      name: 'page transition',
      marker: 'page loaded',
      startTime: 1000,
      currentTime: 3000,
      pending: [],
    });

    expect(onTransitionComplete).toHaveBeenCalledTimes(1);
    expect(onTransitionComplete.mock.calls[0][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
      endTime: 3000,
    });
    expect(onMarkerComplete).toHaveBeenCalledTimes(1);
    expect(onMarkerComplete.mock.calls[0][0]).toEqual({
      name: 'page transition',
      marker: 'page loaded',
      startTime: 1000,
      endTime: 3000,
    });
  });

  it.skip('tracing marker leaf components', async () => {
    let navigateToPageTwo;
    function App() {
      const [navigate, setNavigate] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      return (
        <div>
          {navigate ? (
            <>
              <Suspense
                name="Suspense One"
                fallback={<Text text="Loading One..." />}>
                <AsyncText text="Subtree One" />
                <TracingMarker name="Subtree One Loaded" />
              </Suspense>
              <Suspense
                name="Suspense Two"
                fallback={<Text text="Loading Two..." />}>
                <AsyncText text="Subtree Two" />
                <TracingMarker name="Subtree Two Loaded" />
              </Suspense>
            </>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({transitionCallbacks});
    await act(async () => {
      root.render(<App />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One']);
    });

    await act(async () => {
      startTransition(() => navigateToPageTwo(), {name: 'page transition'});

      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Suspend [Subtree One]',
        'Loading One...',
        'Suspend [Subtree Two]',
        'Loading Two...',
      ]);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Subtree One');

      expect(Scheduler).toFlushAndYield(['Subtree One']);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Subtree Two');
      expect(Scheduler).toFlushAndYield(['Subtree Two']);
    });

    expect(onTransitionStart).toHaveBeenCalledTimes(1);
    expect(onTransitionStart.mock.calls[0][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
    });

    expect(onTransitionProgress).toHaveBeenCalledTimes(3);
    expect(onTransitionProgress.mock.calls[0][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
      currentTime: 2000,
      pending: [{name: 'Suspense One'}, {name: 'Suspense Two'}],
    });
    expect(onTransitionProgress.mock.calls[1][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
      currentTime: 3000,
      pending: [{name: 'Suspense Two'}],
    });
    expect(onTransitionProgress.mock.calls[2][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
      currentTime: 4000,
      pending: [],
    });

    expect(onMarkerProgress).toHaveBeenCalledTimes(2);
    expect(onMarkerProgress.mock.calls[0][0]).toEqual({
      name: 'page transition',
      marker: 'Subtree One Loaded',
      startTime: 3000,
      currentTime: 3000,
      pending: [],
    });
    expect(onMarkerProgress.mock.calls[1][0]).toEqual({
      name: 'page transition',
      marker: 'Subtree Two Loaded',
      startTime: 4000,
      currentTime: 4000,
      pending: [],
    });

    expect(onTransitionComplete).toHaveBeenCalledTimes(1);
    expect(onTransitionComplete.mock.calls[0][0]).toEqual({
      name: 'page transition',
      startTime: 1000,
      endTime: 4000,
    });
    expect(onMarkerComplete).toHaveBeenCalledTimes(2);
    expect(onMarkerComplete.mock.calls[0][0]).toEqual({
      name: 'page transition',
      marker: 'Subtree One Loaded',
      startTime: 3000,
      endTime: 3000,
    });
    expect(onMarkerComplete.mock.calls[1][0]).toEqual({
      name: 'page transition',
      marker: 'Subtree Two Loaded',
      startTime: 4000,
      endTime: 4000,
    });
  });
});
