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
          Scheduler.yieldValue('Child');
          React.useEffect(
            () => {
              if (didMount) {
                Scheduler.yieldValue('Child:update');
              } else {
                Scheduler.yieldValue('Child:mount');
                setDidMount(true);
              }
            },
            [didMount],
          );
          return <div />;
        };

        const App = () => {
          Scheduler.yieldValue('App');
          React.useEffect(() => {
            Scheduler.yieldValue('App:mount');
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

          root.render(
            <React.Profiler id="test" onRender={onRender}>
              <App />
            </React.Profiler>,
          );
        });

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
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
        expect(onRender).toHaveBeenCalledTimes(3);
        expect(onRender).toHaveLastRenderedWithInteractions(
          new Set([interaction]),
        );
      });

      it('traces interaction through hidden subtree when there is other pending traced work', () => {
        const Child = () => {
          Scheduler.yieldValue('Child');
          return <div />;
        };

        let wrapped = null;

        const App = () => {
          Scheduler.yieldValue('App');
          React.useEffect(() => {
            wrapped = SchedulerTracing.unstable_wrap(() => {});
            Scheduler.yieldValue('App:mount');
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

          root.render(
            <React.Profiler id="test" onRender={onRender}>
              <App />
            </React.Profiler>,
          );
        });

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
          Scheduler.yieldValue('Child');
          React.useLayoutEffect(
            () => {
              if (didMount) {
                Scheduler.yieldValue('Child:update');
              } else {
                Scheduler.yieldValue('Child:mount');
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
          Scheduler.yieldValue('App');
          React.useEffect(() => {
            Scheduler.yieldValue('App:mount');
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

          root.render(
            <React.Profiler id="test" onRender={onRender}>
              <App />
            </React.Profiler>,
          );
        });

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
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);
        expect(onRender).toHaveBeenCalledTimes(3);
        expect(onRender).toHaveLastRenderedWithInteractions(
          new Set([interaction]),
        );
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
        Scheduler.flushAll();
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
        Scheduler.flushAll();
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
        Scheduler.flushAll();
        jest.runAllTimers();

        expect(ref.current).not.toBe(null);
        expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(interaction);

        done();
      });
    });
  });
});
