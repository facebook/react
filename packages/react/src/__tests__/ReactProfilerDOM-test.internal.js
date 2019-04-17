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
let ReactFeatureFlags;
let ReactDOM;
let SchedulerTracing;
let Scheduler;
let ReactCache;

function loadModules() {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.debugRenderPhaseSideEffects = false;
  ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
  ReactFeatureFlags.enableProfilerTimer = true;
  ReactFeatureFlags.enableSchedulerTracing = true;

  React = require('react');
  SchedulerTracing = require('scheduler/tracing');
  ReactDOM = require('react-dom');
  Scheduler = require('scheduler');
  ReactCache = require('react-cache');
}

describe('ProfilerDOM', () => {
  let TextResource;
  let resourcePromise;
  let onInteractionScheduledWorkCompleted;
  let onInteractionTraced;

  beforeEach(() => {
    loadModules();

    onInteractionScheduledWorkCompleted = jest.fn();
    onInteractionTraced = jest.fn();

    // Verify interaction subscriber methods are called as expected.
    SchedulerTracing.unstable_subscribe({
      onInteractionScheduledWorkCompleted,
      onInteractionTraced,
      onWorkCanceled: () => {},
      onWorkScheduled: () => {},
      onWorkStarted: () => {},
      onWorkStopped: () => {},
    });

    resourcePromise = null;

    TextResource = ReactCache.unstable_createResource(([text, ms = 0]) => {
      resourcePromise = new Promise(
        SchedulerTracing.unstable_wrap((resolve, reject) => {
          setTimeout(
            SchedulerTracing.unstable_wrap(() => {
              resolve(text);
            }),
            ms,
          );
        }),
      );
      return resourcePromise;
    }, ([text, ms]) => text);
  });

  const AsyncText = ({ms, text}) => {
    TextResource.read([text, ms]);
    return text;
  };

  const Text = ({text}) => text;

  it('should correctly trace interactions for async roots', async done => {
    let batch, element, interaction;

    SchedulerTracing.unstable_trace('initial_event', performance.now(), () => {
      const interactions = SchedulerTracing.unstable_getCurrent();
      expect(interactions.size).toBe(1);
      interaction = Array.from(interactions)[0];

      element = document.createElement('div');
      const root = ReactDOM.unstable_createRoot(element);
      batch = root.createBatch();
      batch.render(
        <React.Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="Text" ms={2000} />
        </React.Suspense>,
      );
      batch.then(
        SchedulerTracing.unstable_wrap(() => {
          batch.commit();

          expect(element.textContent).toBe('Loading...');
          expect(onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

          jest.runAllTimers();

          resourcePromise.then(
            SchedulerTracing.unstable_wrap(() => {
              jest.runAllTimers();
              Scheduler.flushAll();

              expect(element.textContent).toBe('Text');
              expect(onInteractionTraced).toHaveBeenCalledTimes(1);
              expect(
                onInteractionScheduledWorkCompleted,
              ).not.toHaveBeenCalled();

              // Evaluate in an unwrapped callback,
              // Because trace/wrap won't decrement the count within the wrapped callback.
              Promise.resolve().then(() => {
                expect(onInteractionTraced).toHaveBeenCalledTimes(1);
                expect(
                  onInteractionScheduledWorkCompleted,
                ).toHaveBeenCalledTimes(1);
                expect(
                  onInteractionScheduledWorkCompleted,
                ).toHaveBeenLastNotifiedOfInteraction(interaction);

                expect(interaction.__count).toBe(0);

                done();
              });
            }),
          );
        }),
      );

      Scheduler.flushAll();
    });

    expect(onInteractionTraced).toHaveBeenCalledTimes(1);
    expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
      interaction,
    );
    expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
    Scheduler.flushAll();
    jest.advanceTimersByTime(500);
  });
});
