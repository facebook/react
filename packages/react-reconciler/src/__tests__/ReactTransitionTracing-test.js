/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

let React;
let ReactNoop;
let Scheduler;
let act;

let getCacheForType;
let useState;
let Suspense;
let Offscreen;
let startTransition;

let caches;
let seededCache;

describe('ReactInteractionTracing', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    act = require('jest-react').act;

    useState = React.useState;
    startTransition = React.startTransition;
    Suspense = React.Suspense;
    Offscreen = React.unstable_Offscreen;

    getCacheForType = React.unstable_getCacheForType;

    caches = [];
    seededCache = null;
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

  // @gate enableTransitionTracing
  it(' should not call callbacks when transition is not defined', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
      onMarkerProgress: (
        transitioName,
        markerName,
        startTime,
        currentTime,
        pending,
      ) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onMarkerProgress(${transitioName}, ${markerName}, ${startTime}, ${currentTime}, [${suspenseNames}])`,
        );
      },
      onMarkerComplete: (transitioName, markerName, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onMarkerComplete(${transitioName}, ${markerName}, ${startTime}, ${endTime})`,
        );
      },
    };

    function App({navigate}) {
      return (
        <div>
          {navigate ? (
            <React.unstable_TracingMarker name="marker">
              <Text text="Page Two" />
            </React.unstable_TracingMarker>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(async () => {
      root.render(<App navigate={false} />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One']);

      await act(async () => {
        startTransition(() => root.render(<App navigate={true} />));

        ReactNoop.expire(1000);
        await advanceTimers(1000);

        // Doesn't call transition or marker code
        expect(Scheduler).toFlushAndYield(['Page Two']);

        startTransition(() => root.render(<App navigate={false} />), {
          name: 'transition',
        });
        expect(Scheduler).toFlushAndYield([
          'Page One',
          'onTransitionStart(transition, 2000)',
          'onTransitionComplete(transition, 2000, 2000)',
        ]);
      });
    });
  });

  // @gate enableTransitionTracing
  it('should correctly trace basic interaction', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
    };

    let navigateToPageTwo;
    function App() {
      const [navigate, setNavigate] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      return (
        <div>
          {navigate ? <Text text="Page Two" /> : <Text text="Page One" />}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(async () => {
      root.render(<App />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One']);

      await act(async () => {
        startTransition(() => navigateToPageTwo(), {name: 'page transition'});

        ReactNoop.expire(1000);
        await advanceTimers(1000);

        expect(Scheduler).toFlushAndYield([
          'Page Two',
          'onTransitionStart(page transition, 1000)',
          'onTransitionComplete(page transition, 1000, 2000)',
        ]);
      });
    });
  });

  // @gate enableTransitionTracing
  it('multiple updates in transition callback should only result in one transitionStart/transitionComplete call', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
    };

    let navigateToPageTwo;
    let setText;
    function App() {
      const [navigate, setNavigate] = useState(false);
      const [text, _setText] = useState('hide');
      navigateToPageTwo = () => setNavigate(true);
      setText = () => _setText('show');

      return (
        <div>
          {navigate ? (
            <Text text={`Page Two: ${text}`} />
          ) : (
            <Text text={`Page One: ${text}`} />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(async () => {
      root.render(<App />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One: hide']);

      await act(async () => {
        startTransition(
          () => {
            navigateToPageTwo();
            setText();
          },
          {name: 'page transition'},
        );

        ReactNoop.expire(1000);
        await advanceTimers(1000);

        expect(Scheduler).toFlushAndYield([
          'Page Two: show',
          'onTransitionStart(page transition, 1000)',
          'onTransitionComplete(page transition, 1000, 2000)',
        ]);
      });
    });
  });

  // @gate enableTransitionTracing
  it('should correctly trace interactions for async roots', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
    };
    let navigateToPageTwo;
    function App() {
      const [navigate, setNavigate] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      return (
        <div>
          {navigate ? (
            <Suspense
              fallback={<Text text="Loading..." />}
              unstable_name="suspense page">
              <AsyncText text="Page Two" />
            </Suspense>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
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
        'Suspend [Page Two]',
        'Loading...',
        'onTransitionStart(page transition, 1000)',
        'onTransitionProgress(page transition, 1000, 2000, [suspense page])',
      ]);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Page Two');

      expect(Scheduler).toFlushAndYield([
        'Page Two',
        'onTransitionProgress(page transition, 1000, 3000, [])',
        'onTransitionComplete(page transition, 1000, 3000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('should correctly trace multiple separate root interactions', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
    };

    let navigateToPageTwo;
    let showTextFn;
    function App() {
      const [navigate, setNavigate] = useState(false);
      const [showText, setShowText] = useState(false);

      navigateToPageTwo = () => {
        setNavigate(true);
      };

      showTextFn = () => {
        setShowText(true);
      };

      return (
        <div>
          {navigate ? (
            <>
              {showText ? (
                <Suspense
                  unstable_name="show text"
                  fallback={<Text text="Show Text Loading..." />}>
                  <AsyncText text="Show Text" />
                </Suspense>
              ) : null}
              <Suspense
                fallback={<Text text="Loading..." />}
                unstable_name="suspense page">
                <AsyncText text="Page Two" />
              </Suspense>
            </>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(async () => {
      root.render(<App />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One']);
    });

    await act(async () => {
      startTransition(() => navigateToPageTwo(), {name: 'page transition'});

      expect(Scheduler).toFlushAndYield([
        'Suspend [Page Two]',
        'Loading...',
        'onTransitionStart(page transition, 1000)',
        'onTransitionProgress(page transition, 1000, 1000, [suspense page])',
      ]);

      await resolveText('Page Two');
      ReactNoop.expire(1000);
      await advanceTimers(1000);
      expect(Scheduler).toFlushAndYield([
        'Page Two',
        'onTransitionProgress(page transition, 1000, 2000, [])',
        'onTransitionComplete(page transition, 1000, 2000)',
      ]);

      startTransition(() => showTextFn(), {name: 'text transition'});
      expect(Scheduler).toFlushAndYield([
        'Suspend [Show Text]',
        'Show Text Loading...',
        'Page Two',
        'onTransitionStart(text transition, 2000)',
        'onTransitionProgress(text transition, 2000, 2000, [show text])',
      ]);

      await resolveText('Show Text');
      ReactNoop.expire(1000);
      await advanceTimers(1000);
      expect(Scheduler).toFlushAndYield([
        'Show Text',
        'onTransitionProgress(text transition, 2000, 3000, [])',
        'onTransitionComplete(text transition, 2000, 3000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('should correctly trace multiple intertwined root interactions', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
    };
    let navigateToPageTwo;
    let showTextFn;
    function App() {
      const [navigate, setNavigate] = useState(false);
      const [showText, setShowText] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      showTextFn = () => {
        setShowText(true);
      };

      return (
        <div>
          {navigate ? (
            <>
              {showText ? (
                <Suspense
                  unstable_name="show text"
                  fallback={<Text text="Show Text Loading..." />}>
                  <AsyncText text="Show Text" />
                </Suspense>
              ) : null}
              <Suspense
                fallback={<Text text="Loading..." />}
                unstable_name="suspense page">
                <AsyncText text="Page Two" />
              </Suspense>
            </>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
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
        'Suspend [Page Two]',
        'Loading...',
        'onTransitionStart(page transition, 1000)',
        'onTransitionProgress(page transition, 1000, 2000, [suspense page])',
      ]);
    });

    await act(async () => {
      startTransition(() => showTextFn(), {name: 'show text'});

      expect(Scheduler).toFlushAndYield([
        'Suspend [Show Text]',
        'Show Text Loading...',
        'Suspend [Page Two]',
        'Loading...',
        'onTransitionStart(show text, 2000)',
        'onTransitionProgress(show text, 2000, 2000, [show text])',
      ]);
    });

    await act(async () => {
      await resolveText('Page Two');
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Page Two',
        'onTransitionProgress(page transition, 1000, 3000, [])',
        'onTransitionComplete(page transition, 1000, 3000)',
      ]);

      await resolveText('Show Text');
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Show Text',
        'onTransitionProgress(show text, 2000, 4000, [])',
        'onTransitionComplete(show text, 2000, 4000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('trace interaction with nested and sibling suspense boundaries', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
    };

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
                fallback={<Text text="Loading..." />}
                unstable_name="suspense page">
                <AsyncText text="Page Two" />
                <Suspense
                  unstable_name="show text one"
                  fallback={<Text text="Show Text One Loading..." />}>
                  <AsyncText text="Show Text One" />
                </Suspense>
                <div>
                  <Suspense
                    unstable_name="show text two"
                    fallback={<Text text="Show Text Two Loading..." />}>
                    <AsyncText text="Show Text Two" />
                  </Suspense>
                </div>
              </Suspense>
            </>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
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
        'Suspend [Page Two]',
        'Suspend [Show Text One]',
        'Show Text One Loading...',
        'Suspend [Show Text Two]',
        'Show Text Two Loading...',
        'Loading...',
        'onTransitionStart(page transition, 1000)',
        'onTransitionProgress(page transition, 1000, 2000, [suspense page])',
      ]);

      resolveText('Page Two');
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Page Two',
        'Suspend [Show Text One]',
        'Show Text One Loading...',
        'Suspend [Show Text Two]',
        'Show Text Two Loading...',
        'onTransitionProgress(page transition, 1000, 3000, [show text one, show text two])',
      ]);

      resolveText('Show Text One');
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Show Text One',
        'onTransitionProgress(page transition, 1000, 4000, [show text two])',
      ]);

      resolveText('Show Text Two');
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Show Text Two',
        'onTransitionProgress(page transition, 1000, 5000, [])',
        'onTransitionComplete(page transition, 1000, 5000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('trace interactions with the same child suspense boundaries', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
    };

    let setNavigate;
    let setShowTextOne;
    let setShowTextTwo;
    function App() {
      const [navigate, _setNavigate] = useState(false);
      const [showTextOne, _setShowTextOne] = useState(false);
      const [showTextTwo, _setShowTextTwo] = useState(false);

      setNavigate = () => _setNavigate(true);
      setShowTextOne = () => _setShowTextOne(true);
      setShowTextTwo = () => _setShowTextTwo(true);

      return (
        <div>
          {navigate ? (
            <>
              <Suspense
                fallback={<Text text="Loading..." />}
                unstable_name="suspense page">
                <AsyncText text="Page Two" />
                {/* showTextOne is entangled with navigate */}
                {showTextOne ? (
                  <Suspense
                    unstable_name="show text one"
                    fallback={<Text text="Show Text One Loading..." />}>
                    <AsyncText text="Show Text One" />
                  </Suspense>
                ) : null}
                <Suspense fallback={<Text text="Show Text Loading..." />}>
                  <AsyncText text="Show Text" />
                </Suspense>
                {/* showTextTwo's suspense boundaries shouldn't stop navigate's suspense boundaries
                 from completing */}
                {showTextTwo ? (
                  <Suspense
                    unstable_name="show text two"
                    fallback={<Text text="Show Text Two Loading..." />}>
                    <AsyncText text="Show Text Two" />
                  </Suspense>
                ) : null}
              </Suspense>
            </>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(async () => {
      root.render(<App />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One']);
    });

    await act(async () => {
      startTransition(() => setNavigate(), {name: 'navigate'});
      startTransition(() => setShowTextOne(), {name: 'show text one'});
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Suspend [Page Two]',
        'Suspend [Show Text One]',
        'Show Text One Loading...',
        'Suspend [Show Text]',
        'Show Text Loading...',
        'Loading...',
        'onTransitionStart(navigate, 1000)',
        'onTransitionStart(show text one, 1000)',
        'onTransitionProgress(navigate, 1000, 2000, [suspense page])',
        'onTransitionProgress(show text one, 1000, 2000, [suspense page])',
      ]);

      resolveText('Page Two');
      ReactNoop.expire(1000);
      await advanceTimers(1000);
      expect(Scheduler).toFlushAndYield([
        'Page Two',
        'Suspend [Show Text One]',
        'Show Text One Loading...',
        'Suspend [Show Text]',
        'Show Text Loading...',
        'onTransitionProgress(navigate, 1000, 3000, [show text one, <null>])',
        'onTransitionProgress(show text one, 1000, 3000, [show text one, <null>])',
      ]);

      startTransition(() => setShowTextTwo(), {name: 'show text two'});
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Page Two',
        'Suspend [Show Text One]',
        'Show Text One Loading...',
        'Suspend [Show Text]',
        'Show Text Loading...',
        'Suspend [Show Text Two]',
        'Show Text Two Loading...',
        'onTransitionStart(show text two, 3000)',
        'onTransitionProgress(show text two, 3000, 4000, [show text two])',
      ]);

      // This should not cause navigate to finish because it's entangled with
      // show text one
      resolveText('Show Text');
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Show Text',
        'onTransitionProgress(navigate, 1000, 5000, [show text one])',
        'onTransitionProgress(show text one, 1000, 5000, [show text one])',
      ]);

      // This should not cause show text two to finish but nothing else
      resolveText('Show Text Two');
      ReactNoop.expire(1000);
      await advanceTimers(1000);
      expect(Scheduler).toFlushAndYield([
        'Show Text Two',
        'onTransitionProgress(show text two, 3000, 6000, [])',
        'onTransitionComplete(show text two, 3000, 6000)',
      ]);

      // This should cause everything to finish
      resolveText('Show Text One');
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield([
        'Show Text One',
        'onTransitionProgress(navigate, 1000, 7000, [])',
        'onTransitionProgress(show text one, 1000, 7000, [])',
        'onTransitionComplete(navigate, 1000, 7000)',
        'onTransitionComplete(show text one, 1000, 7000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('should correctly trace basic interaction with tracing markers', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionProgress: (name, startTime, endTime, pending) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onTransitionProgress(${name}, ${startTime}, ${endTime}, [${suspenseNames}])`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
      onMarkerProgress: (
        transitioName,
        markerName,
        startTime,
        currentTime,
        pending,
      ) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onMarkerProgress(${transitioName}, ${markerName}, ${startTime}, ${currentTime}, [${suspenseNames}])`,
        );
      },
      onMarkerComplete: (transitioName, markerName, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onMarkerComplete(${transitioName}, ${markerName}, ${startTime}, ${endTime})`,
        );
      },
    };

    let navigateToPageTwo;
    function App() {
      const [navigate, setNavigate] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      return (
        <div>
          {navigate ? (
            <React.unstable_TracingMarker name="marker two" key="marker two">
              <Text text="Page Two" />
            </React.unstable_TracingMarker>
          ) : (
            <React.unstable_TracingMarker name="marker one">
              <Text text="Page One" />
            </React.unstable_TracingMarker>
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(async () => {
      root.render(<App />);
      ReactNoop.expire(1000);
      await advanceTimers(1000);

      expect(Scheduler).toFlushAndYield(['Page One']);

      await act(async () => {
        startTransition(() => navigateToPageTwo(), {name: 'page transition'});

        ReactNoop.expire(1000);
        await advanceTimers(1000);

        expect(Scheduler).toFlushAndYield([
          'Page Two',
          'onTransitionStart(page transition, 1000)',
          'onMarkerComplete(page transition, marker two, 1000, 2000)',
          'onTransitionComplete(page transition, 1000, 2000)',
        ]);
      });
    });
  });

  // @gate enableTransitionTracing
  it('should correctly trace interactions for tracing markers', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
      onMarkerProgress: (
        transitioName,
        markerName,
        startTime,
        currentTime,
        pending,
      ) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onMarkerProgress(${transitioName}, ${markerName}, ${startTime}, ${currentTime}, [${suspenseNames}])`,
        );
      },
      onMarkerComplete: (transitioName, markerName, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onMarkerComplete(${transitioName}, ${markerName}, ${startTime}, ${endTime})`,
        );
      },
    };
    let navigateToPageTwo;
    function App() {
      const [navigate, setNavigate] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      return (
        <div>
          {navigate ? (
            <Suspense
              fallback={<Text text="Loading..." />}
              unstable_name="suspense page">
              <AsyncText text="Page Two" />
              <React.unstable_TracingMarker name="sync marker" />
              <React.unstable_TracingMarker name="async marker">
                <Suspense
                  fallback={<Text text="Loading..." />}
                  unstable_name="marker suspense">
                  <AsyncText text="Marker Text" />
                </Suspense>
              </React.unstable_TracingMarker>
            </Suspense>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
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
        'Suspend [Page Two]',
        'Suspend [Marker Text]',
        'Loading...',
        'Loading...',
        'onTransitionStart(page transition, 1000)',
      ]);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Page Two');

      expect(Scheduler).toFlushAndYield([
        'Page Two',
        'Suspend [Marker Text]',
        'Loading...',
        'onMarkerProgress(page transition, async marker, 1000, 3000, [marker suspense])',
        'onMarkerComplete(page transition, sync marker, 1000, 3000)',
      ]);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Marker Text');

      expect(Scheduler).toFlushAndYield([
        'Marker Text',
        'onMarkerProgress(page transition, async marker, 1000, 4000, [])',
        'onMarkerComplete(page transition, async marker, 1000, 4000)',
        'onTransitionComplete(page transition, 1000, 4000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('trace interaction with multiple tracing markers', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
      onMarkerProgress: (
        transitioName,
        markerName,
        startTime,
        currentTime,
        pending,
      ) => {
        const suspenseNames = pending.map(p => p.name || '<null>').join(', ');
        Scheduler.unstable_yieldValue(
          `onMarkerProgress(${transitioName}, ${markerName}, ${startTime}, ${currentTime}, [${suspenseNames}])`,
        );
      },
      onMarkerComplete: (transitioName, markerName, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onMarkerComplete(${transitioName}, ${markerName}, ${startTime}, ${endTime})`,
        );
      },
    };

    let navigateToPageTwo;
    function App() {
      const [navigate, setNavigate] = useState(false);
      navigateToPageTwo = () => {
        setNavigate(true);
      };

      return (
        <div>
          {navigate ? (
            <React.unstable_TracingMarker name="outer marker">
              <Suspense
                fallback={<Text text="Outer..." />}
                unstable_name="outer">
                <AsyncText text="Outer Text" />
                <Suspense
                  fallback={<Text text="Inner One..." />}
                  unstable_name="inner one">
                  <React.unstable_TracingMarker name="marker one">
                    <AsyncText text="Inner Text One" />
                  </React.unstable_TracingMarker>
                </Suspense>
                <Suspense
                  fallback={<Text text="Inner Two..." />}
                  unstable_name="inner two">
                  <React.unstable_TracingMarker name="marker two">
                    <AsyncText text="Inner Text Two" />
                  </React.unstable_TracingMarker>
                </Suspense>
              </Suspense>
            </React.unstable_TracingMarker>
          ) : (
            <Text text="Page One" />
          )}
        </div>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
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
        'Suspend [Outer Text]',
        'Suspend [Inner Text One]',
        'Inner One...',
        'Suspend [Inner Text Two]',
        'Inner Two...',
        'Outer...',
        'onTransitionStart(page transition, 1000)',
        'onMarkerProgress(page transition, outer marker, 1000, 2000, [outer])',
      ]);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Inner Text Two');
      expect(Scheduler).toFlushAndYield([]);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Outer Text');
      expect(Scheduler).toFlushAndYield([
        'Outer Text',
        'Suspend [Inner Text One]',
        'Inner One...',
        'Inner Text Two',
        'onMarkerProgress(page transition, outer marker, 1000, 4000, [inner one])',
        'onMarkerComplete(page transition, marker two, 1000, 4000)',
      ]);

      ReactNoop.expire(1000);
      await advanceTimers(1000);
      await resolveText('Inner Text One');
      expect(Scheduler).toFlushAndYield([
        'Inner Text One',
        'onMarkerProgress(page transition, outer marker, 1000, 5000, [])',
        'onMarkerComplete(page transition, marker one, 1000, 5000)',
        'onMarkerComplete(page transition, outer marker, 1000, 5000)',
        'onTransitionComplete(page transition, 1000, 5000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('warns when marker name changes', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
      onMarkerComplete: (transitioName, markerName, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onMarkerComplete(${transitioName}, ${markerName}, ${startTime}, ${endTime})`,
        );
      },
    };
    function App({markerName, markerKey}) {
      return (
        <React.unstable_TracingMarker name={markerName} key={markerKey}>
          <Text text={markerName} />
        </React.unstable_TracingMarker>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(async () => {
      startTransition(
        () => root.render(<App markerName="one" markerKey="key" />),
        {
          name: 'transition one',
        },
      );
      ReactNoop.expire(1000);
      await advanceTimers(1000);
      expect(Scheduler).toFlushAndYield([
        'one',
        'onTransitionStart(transition one, 0)',
        'onMarkerComplete(transition one, one, 0, 1000)',
        'onTransitionComplete(transition one, 0, 1000)',
      ]);
      startTransition(
        () => root.render(<App markerName="two" markerKey="key" />),
        {
          name: 'transition two',
        },
      );
      ReactNoop.expire(1000);
      await advanceTimers(1000);
      expect(() => {
        // onMarkerComplete shouldn't be called for transitions with
        // new keys
        expect(Scheduler).toFlushAndYield([
          'two',
          'onTransitionStart(transition two, 1000)',
          'onTransitionComplete(transition two, 1000, 2000)',
        ]);
      }).toErrorDev(
        'Changing the name of a tracing marker after mount is not supported.',
      );
      startTransition(
        () => root.render(<App markerName="three" markerKey="new key" />),
        {
          name: 'transition three',
        },
      );
      ReactNoop.expire(1000);
      await advanceTimers(1000);
      // This should not warn and onMarkerComplete should be called
      expect(Scheduler).toFlushAndYield([
        'three',
        'onTransitionStart(transition three, 2000)',
        'onMarkerComplete(transition three, three, 2000, 3000)',
        'onTransitionComplete(transition three, 2000, 3000)',
      ]);
    });
  });

  // @gate enableTransitionTracing
  it('offscreen trees should not stop transition from completing', async () => {
    const transitionCallbacks = {
      onTransitionStart: (name, startTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionStart(${name}, ${startTime})`,
        );
      },
      onTransitionComplete: (name, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onTransitionComplete(${name}, ${startTime}, ${endTime})`,
        );
      },
      onMarkerComplete: (transitioName, markerName, startTime, endTime) => {
        Scheduler.unstable_yieldValue(
          `onMarkerComplete(${transitioName}, ${markerName}, ${startTime}, ${endTime})`,
        );
      },
    };

    function App() {
      return (
        <React.unstable_TracingMarker name="marker">
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text="Text" />
          </Suspense>
          <Offscreen mode="hidden">
            <Suspense fallback={<Text text="Hidden Loading..." />}>
              <AsyncText text="Hidden Text" />
            </Suspense>
          </Offscreen>
        </React.unstable_TracingMarker>
      );
    }

    const root = ReactNoop.createRoot({
      unstable_transitionCallbacks: transitionCallbacks,
    });
    await act(() => {
      startTransition(() => root.render(<App />), {name: 'transition'});
      ReactNoop.expire(1000);
      advanceTimers(1000);
    });
    expect(Scheduler).toHaveYielded([
      'Suspend [Text]',
      'Loading...',
      'Suspend [Hidden Text]',
      'Hidden Loading...',
      'onTransitionStart(transition, 0)',
    ]);

    await act(() => {
      resolveText('Text');
      ReactNoop.expire(1000);
      advanceTimers(1000);
    });
    expect(Scheduler).toHaveYielded([
      'Text',
      'onMarkerComplete(transition, marker, 0, 2000)',
      'onTransitionComplete(transition, 0, 2000)',
    ]);

    await act(() => {
      resolveText('Hidden Text');
      ReactNoop.expire(1000);
      advanceTimers(1000);
    });
    expect(Scheduler).toHaveYielded(['Hidden Text']);
  });
});
