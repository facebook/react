/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactDOMServer;
let ReactFeatureFlags;
let Scheduler;
let SchedulerTracing;
let TestUtils;
let onInteractionScheduledWorkCompleted;
let onInteractionTraced;
let onWorkCanceled;
let onWorkScheduled;
let onWorkStarted;
let onWorkStopped;

function loadModules() {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.debugRenderPhaseSideEffects = false;
  ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
  ReactFeatureFlags.enableSuspenseServerRenderer = true;
  ReactFeatureFlags.enableProfilerTimer = true;
  ReactFeatureFlags.enableSchedulerTracing = true;
  ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;

  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  Scheduler = require('scheduler');
  SchedulerTracing = require('scheduler/tracing');
  TestUtils = require('react-dom/test-utils');

  onInteractionScheduledWorkCompleted = jest.fn();
  onInteractionTraced = jest.fn();
  onWorkCanceled = jest.fn();
  onWorkScheduled = jest.fn();
  onWorkStarted = jest.fn();
  onWorkStopped = jest.fn();

  // Verify interaction subscriber methods are called as expected.
  SchedulerTracing.unstable_subscribe({
    onInteractionScheduledWorkCompleted,
    onInteractionTraced,
    onWorkCanceled,
    onWorkScheduled,
    onWorkStarted,
    onWorkStopped,
  });
}

describe('ReactDOMTracing', () => {
  beforeEach(() => {
    jest.resetModules();

    loadModules();
  });

  describe('interaction tracing', () => {
    describe('hidden', () => {
      it('traces interaction through hidden subtree', () => {
        const Child = () => {
          const [didMount, setDidMount] = React.useState(false);
          Scheduler.unstable_yieldValue('Child');
          React.useEffect(
            () => {
              if (didMount) {
                Scheduler.unstable_yieldValue('Child:update');
              } else {
                Scheduler.unstable_yieldValue('Child:mount');
                setDidMount(true);
              }
            },
            [didMount],
          );
          return <div />;
        };

        const App = () => {
          Scheduler.unstable_yieldValue('App');
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('App:mount');
          }, []);
          return (
            <div hidden={true}>
              <Child />
            </div>
          );
        };

        let interaction;

        const onRender = jest.fn();

        const container = document.createElement('div');
        const root = ReactDOM.unstable_createRoot(container);
        SchedulerTracing.unstable_trace('initialization', 0, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
          TestUtils.act(() => {
            root.render(
              <React.Profiler id="test" onRender={onRender}>
                <App />
              </React.Profiler>,
            );
            expect(onInteractionTraced).toHaveBeenCalledTimes(1);
            expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
              interaction,
            );
            expect(Scheduler).toFlushAndYieldThrough(['App', 'App:mount']);
            expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
            expect(onRender).toHaveBeenCalledTimes(1);
            expect(onRender).toHaveLastRenderedWithInteractions(
              new Set([interaction]),
            );
            expect(Scheduler).toFlushAndYieldThrough(['Child', 'Child:mount']);
            expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
            expect(onRender).toHaveBeenCalledTimes(2);
            expect(onRender).toHaveLastRenderedWithInteractions(
              new Set([interaction]),
            );

            expect(Scheduler).toFlushAndYield(['Child', 'Child:update']);
          });
        });
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
        // TODO: This is 4 instead of 3 because this update was scheduled at
        // idle priority, and idle updates are slightly higher priority than
        // offscreen work. So it takes two render passes to finish it. Profiler
        // calls `onRender` for the first render even though everything
        // bails out.
        expect(onRender).toHaveBeenCalledTimes(4);
        expect(onRender).toHaveLastRenderedWithInteractions(
          new Set([interaction]),
        );
      });

      it('traces interaction through hidden subtree when there is other pending traced work', () => {
        const Child = () => {
          Scheduler.unstable_yieldValue('Child');
          return <div />;
        };

        let wrapped = null;

        const App = () => {
          Scheduler.unstable_yieldValue('App');
          React.useEffect(() => {
            wrapped = SchedulerTracing.unstable_wrap(() => {});
            Scheduler.unstable_yieldValue('App:mount');
          }, []);
          return (
            <div hidden={true}>
              <Child />
            </div>
          );
        };

        let interaction;

        const onRender = jest.fn();

        const container = document.createElement('div');
        const root = ReactDOM.unstable_createRoot(container);
        SchedulerTracing.unstable_trace('initialization', 0, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];

          TestUtils.act(() => {
            root.render(
              <React.Profiler id="test" onRender={onRender}>
                <App />
              </React.Profiler>,
            );
            expect(onInteractionTraced).toHaveBeenCalledTimes(1);
            expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
              interaction,
            );

            expect(Scheduler).toFlushAndYieldThrough(['App', 'App:mount']);
            expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
            expect(onRender).toHaveBeenCalledTimes(1);
            expect(onRender).toHaveLastRenderedWithInteractions(
              new Set([interaction]),
            );

            expect(wrapped).not.toBeNull();

            expect(Scheduler).toFlushAndYield(['Child']);
            expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
            expect(onRender).toHaveBeenCalledTimes(2);
            expect(onRender).toHaveLastRenderedWithInteractions(
              new Set([interaction]),
            );
          });
        });

        wrapped();
        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
      });

      it('traces interaction through hidden subtree that schedules more idle/never work', () => {
        const Child = () => {
          const [didMount, setDidMount] = React.useState(false);
          Scheduler.unstable_yieldValue('Child');
          React.useLayoutEffect(
            () => {
              if (didMount) {
                Scheduler.unstable_yieldValue('Child:update');
              } else {
                Scheduler.unstable_yieldValue('Child:mount');
                Scheduler.unstable_runWithPriority(
                  Scheduler.unstable_IdlePriority,
                  () => setDidMount(true),
                );
              }
            },
            [didMount],
          );
          return <div />;
        };

        const App = () => {
          Scheduler.unstable_yieldValue('App');
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('App:mount');
          }, []);
          return (
            <div hidden={true}>
              <Child />
            </div>
          );
        };

        let interaction;

        const onRender = jest.fn();

        const container = document.createElement('div');
        const root = ReactDOM.unstable_createRoot(container);
        SchedulerTracing.unstable_trace('initialization', 0, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
          TestUtils.act(() => {
            root.render(
              <React.Profiler id="test" onRender={onRender}>
                <App />
              </React.Profiler>,
            );
            expect(onInteractionTraced).toHaveBeenCalledTimes(1);
            expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
              interaction,
            );

            expect(Scheduler).toFlushAndYieldThrough(['App', 'App:mount']);
            expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
            expect(onRender).toHaveBeenCalledTimes(1);
            expect(onRender).toHaveLastRenderedWithInteractions(
              new Set([interaction]),
            );

            expect(Scheduler).toFlushAndYieldThrough(['Child', 'Child:mount']);
            expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
            expect(onRender).toHaveBeenCalledTimes(2);
            expect(onRender).toHaveLastRenderedWithInteractions(
              new Set([interaction]),
            );

            expect(Scheduler).toFlushAndYield(['Child', 'Child:update']);
          });
        });

        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
        // TODO: This is 4 instead of 3 because this update was scheduled at
        // idle priority, and idle updates are slightly higher priority than
        // offscreen work. So it takes two render passes to finish it. Profiler
        // calls `onRender` for the first render even though everything
        // bails out.
        expect(onRender).toHaveBeenCalledTimes(4);
        expect(onRender).toHaveLastRenderedWithInteractions(
          new Set([interaction]),
        );
      });

      it('does not continue interactions across pre-existing idle work', () => {
        const Child = () => {
          Scheduler.unstable_yieldValue('Child');
          return <div />;
        };

        let update = null;

        const WithHiddenWork = () => {
          Scheduler.unstable_yieldValue('WithHiddenWork');
          return (
            <div hidden={true}>
              <Child />
            </div>
          );
        };

        const Updater = () => {
          Scheduler.unstable_yieldValue('Updater');
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('Updater:effect');
          });

          const setCount = React.useState(0)[1];
          update = () => {
            setCount(current => current + 1);
          };

          return <div />;
        };

        const App = () => {
          Scheduler.unstable_yieldValue('App');
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('App:effect');
          });

          return (
            <>
              <WithHiddenWork />
              <Updater />
            </>
          );
        };

        const onRender = jest.fn();
        const container = document.createElement('div');
        const root = ReactDOM.unstable_createRoot(container);

        // Schedule some idle work without any interactions.
        TestUtils.act(() => {
          root.render(
            <React.Profiler id="test" onRender={onRender}>
              <App />
            </React.Profiler>,
          );
          expect(Scheduler).toFlushAndYieldThrough([
            'App',
            'WithHiddenWork',
            'Updater',
            'Updater:effect',
            'App:effect',
          ]);
          expect(update).not.toBeNull();

          // Trace a higher-priority update.
          let interaction = null;
          SchedulerTracing.unstable_trace('update', 0, () => {
            interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
            update();
          });
          expect(interaction).not.toBeNull();
          expect(onRender).toHaveBeenCalledTimes(1);
          expect(onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
            interaction,
          );

          // Ensure the traced interaction completes without being attributed to the pre-existing idle work.
          expect(Scheduler).toFlushAndYieldThrough([
            'Updater',
            'Updater:effect',
          ]);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(
            onInteractionScheduledWorkCompleted,
          ).toHaveBeenLastNotifiedOfInteraction(interaction);
          expect(onRender).toHaveBeenCalledTimes(2);
          expect(onRender).toHaveLastRenderedWithInteractions(
            new Set([interaction]),
          );

          // Complete low-priority work and ensure no lingering interaction.
          expect(Scheduler).toFlushAndYield(['Child']);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(onRender).toHaveBeenCalledTimes(3);
          expect(onRender).toHaveLastRenderedWithInteractions(new Set([]));
        });
      });

      it('should properly trace interactions when there is work of interleaved priorities', () => {
        const Child = () => {
          Scheduler.unstable_yieldValue('Child');
          return <div />;
        };

        let scheduleUpdate = null;
        let scheduleUpdateWithHidden = null;

        const MaybeHiddenWork = () => {
          const [flag, setFlag] = React.useState(false);
          scheduleUpdateWithHidden = () => setFlag(true);
          Scheduler.unstable_yieldValue('MaybeHiddenWork');
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('MaybeHiddenWork:effect');
          });
          return flag ? (
            <div hidden={true}>
              <Child />
            </div>
          ) : null;
        };

        const Updater = () => {
          Scheduler.unstable_yieldValue('Updater');
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('Updater:effect');
          });

          const setCount = React.useState(0)[1];
          scheduleUpdate = () => setCount(current => current + 1);

          return <div />;
        };

        const App = () => {
          Scheduler.unstable_yieldValue('App');
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('App:effect');
          });

          return (
            <>
              <MaybeHiddenWork />
              <Updater />
            </>
          );
        };

        const onRender = jest.fn();
        const container = document.createElement('div');
        const root = ReactDOM.unstable_createRoot(container);

        TestUtils.act(() => {
          root.render(
            <React.Profiler id="test" onRender={onRender}>
              <App />
            </React.Profiler>,
          );
          expect(Scheduler).toFlushAndYield([
            'App',
            'MaybeHiddenWork',
            'Updater',
            'MaybeHiddenWork:effect',
            'Updater:effect',
            'App:effect',
          ]);
          expect(scheduleUpdate).not.toBeNull();
          expect(scheduleUpdateWithHidden).not.toBeNull();
          expect(onRender).toHaveBeenCalledTimes(1);

          // schedule traced high-pri update and a (non-traced) low-pri update.
          let interaction = null;
          SchedulerTracing.unstable_trace('update', 0, () => {
            interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
            Scheduler.unstable_runWithPriority(
              Scheduler.unstable_UserBlockingPriority,
              () => scheduleUpdateWithHidden(),
            );
          });
          scheduleUpdate();
          expect(interaction).not.toBeNull();
          expect(onRender).toHaveBeenCalledTimes(1);
          expect(onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
            interaction,
          );

          // high-pri update should leave behind idle work and should not complete the interaction
          expect(Scheduler).toFlushAndYieldThrough([
            'MaybeHiddenWork',
            'MaybeHiddenWork:effect',
          ]);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
          expect(onRender).toHaveBeenCalledTimes(2);
          expect(onRender).toHaveLastRenderedWithInteractions(
            new Set([interaction]),
          );

          // low-pri update should not have the interaction
          expect(Scheduler).toFlushAndYieldThrough([
            'Updater',
            'Updater:effect',
          ]);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
          expect(onRender).toHaveBeenCalledTimes(3);
          expect(onRender).toHaveLastRenderedWithInteractions(new Set([]));

          // idle work should complete the interaction
          expect(Scheduler).toFlushAndYield(['Child']);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(
            onInteractionScheduledWorkCompleted,
          ).toHaveBeenLastNotifiedOfInteraction(interaction);
          expect(onRender).toHaveBeenCalledTimes(4);
          expect(onRender).toHaveLastRenderedWithInteractions(
            new Set([interaction]),
          );
        });
      });

      it('should properly trace interactions through a multi-pass SuspenseList render', () => {
        const SuspenseList = React.unstable_SuspenseList;
        const Suspense = React.Suspense;
        function Text({text}) {
          Scheduler.unstable_yieldValue(text);
          React.useEffect(() => {
            Scheduler.unstable_yieldValue('Commit ' + text);
          });
          return <span>{text}</span>;
        }
        function App() {
          return (
            <SuspenseList revealOrder="forwards">
              <Suspense fallback={<Text text="Loading A" />}>
                <Text text="A" />
              </Suspense>
              <Suspense fallback={<Text text="Loading B" />}>
                <Text text="B" />
              </Suspense>
              <Suspense fallback={<Text text="Loading C" />}>
                <Text text="C" />
              </Suspense>
            </SuspenseList>
          );
        }

        const container = document.createElement('div');
        const root = ReactDOM.unstable_createRoot(container);

        let interaction;

        TestUtils.act(() => {
          SchedulerTracing.unstable_trace('initialization', 0, () => {
            interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
            // This render is only CPU bound. Nothing suspends.
            root.render(<App />);
          });

          expect(Scheduler).toFlushAndYieldThrough(['A']);

          Scheduler.unstable_advanceTime(300);
          jest.advanceTimersByTime(300);

          expect(Scheduler).toFlushAndYieldThrough(['B']);

          Scheduler.unstable_advanceTime(300);
          jest.advanceTimersByTime(300);

          // Time has now elapsed for so long that we're just going to give up
          // rendering the rest of the content. So that we can at least show
          // something.
          expect(Scheduler).toFlushAndYieldThrough([
            'Loading C',
            'Commit A',
            'Commit B',
            'Commit Loading C',
          ]);

          // Schedule an unrelated low priority update that shouldn't be included
          // in the previous interaction. This is meant to ensure that we don't
          // rely on the whole tree completing to cover up bugs.
          Scheduler.unstable_runWithPriority(
            Scheduler.unstable_IdlePriority,
            () => root.render(<App />),
          );

          expect(onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
            interaction,
          );
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

          // Then we do a second pass to commit the last item.
          expect(Scheduler).toFlushAndYieldThrough(['C', 'Commit C']);

          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(
            onInteractionScheduledWorkCompleted,
          ).toHaveBeenLastNotifiedOfInteraction(interaction);
        });
      });
    });

    describe('hydration', () => {
      it('traces interaction across hydration', async done => {
        let ref = React.createRef();

        function Child() {
          return 'Hello';
        }

        function App() {
          return (
            <div>
              <span ref={ref}>
                <Child />
              </span>
            </div>
          );
        }

        // Render the final HTML.
        const finalHTML = ReactDOMServer.renderToString(<App />);

        const container = document.createElement('div');
        container.innerHTML = finalHTML;

        let interaction;

        const root = ReactDOM.unstable_createRoot(container, {hydrate: true});

        // Hydrate it.
        SchedulerTracing.unstable_trace('initialization', 0, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];

          root.render(<App />);
        });
        Scheduler.unstable_flushAll();
        jest.runAllTimers();

        expect(ref.current).not.toBe(null);
        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
          interaction,
        );
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);

        done();
      });

      it('traces interaction across suspended hydration', async done => {
        let suspend = false;
        let resolve;
        let promise = new Promise(resolvePromise => (resolve = resolvePromise));
        let ref = React.createRef();

        function Child() {
          if (suspend) {
            throw promise;
          } else {
            return 'Hello';
          }
        }

        function App() {
          return (
            <div>
              <React.Suspense fallback="Loading...">
                <span ref={ref}>
                  <Child />
                </span>
              </React.Suspense>
            </div>
          );
        }

        // Render the final HTML.
        // Don't suspend on the server.
        const finalHTML = ReactDOMServer.renderToString(<App />);

        const container = document.createElement('div');
        container.innerHTML = finalHTML;

        let interaction;

        const root = ReactDOM.unstable_createRoot(container, {hydrate: true});

        // Start hydrating but simulate blocking for suspense data.
        suspend = true;
        SchedulerTracing.unstable_trace('initialization', 0, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];

          root.render(<App />);
        });
        Scheduler.unstable_flushAll();
        jest.runAllTimers();

        expect(ref.current).toBe(null);
        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
          interaction,
        );
        expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

        // Resolving the promise should continue hydration
        suspend = false;
        resolve();
        await promise;
        Scheduler.unstable_flushAll();
        jest.runAllTimers();

        expect(ref.current).not.toBe(null);
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);

        done();
      });

      it('traces interaction across client-rendered hydration', async done => {
        let suspend = false;
        let promise = new Promise(() => {});
        let ref = React.createRef();

        function Child() {
          if (suspend) {
            throw promise;
          } else {
            return 'Hello';
          }
        }

        function App() {
          return (
            <div>
              <React.Suspense fallback="Loading...">
                <span ref={ref}>
                  <Child />
                </span>
              </React.Suspense>
            </div>
          );
        }

        // Render the final HTML.
        suspend = true;
        const finalHTML = ReactDOMServer.renderToString(<App />);

        const container = document.createElement('div');
        container.innerHTML = finalHTML;

        let interaction;

        const root = ReactDOM.unstable_createRoot(container, {hydrate: true});

        // Hydrate without suspending to fill in the client-rendered content.
        suspend = false;
        SchedulerTracing.unstable_trace('initialization', 0, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];

          root.render(<App />);
        });

        expect(onWorkStopped).toHaveBeenCalledTimes(1);

        // Advance time a bit so that we get into a new expiration bucket.
        Scheduler.unstable_advanceTime(300);
        jest.advanceTimersByTime(300);

        Scheduler.unstable_flushAll();
        jest.runAllTimers();

        expect(ref.current).not.toBe(null);

        // We should've had two commits that was traced.
        // First one that hydrates the parent, and then one that hydrates
        // the boundary at higher than Never priority.
        expect(onWorkStopped).toHaveBeenCalledTimes(3);

        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
          interaction,
        );
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);

        done();
      });
    });
  });
});
