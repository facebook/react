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

function loadModules() {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
  ReactFeatureFlags.enableProfilerTimer = true;
  ReactFeatureFlags.enableSchedulerTracing = true;

  React = require('react');
  SchedulerTracing = require('scheduler/tracing');
  ReactDOM = require('react-dom');
  Scheduler = require('scheduler');
}

describe('ProfilerDOM', () => {
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
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  it('should correctly trace interactions for async roots', async () => {
    let resolve;
    let thenable = {
      then(res) {
        resolve = () => {
          thenable = null;
          res();
        };
      },
    };

    function Async() {
      if (thenable !== null) {
        Scheduler.unstable_yieldValue('Suspend! [Async]');
        throw thenable;
      }
      Scheduler.unstable_yieldValue('Async');
      return 'Async';
    }

    const element = document.createElement('div');
    const root = ReactDOM.createRoot(element);

    let interaction;
    let wrappedResolve;
    SchedulerTracing.unstable_trace('initial_event', performance.now(), () => {
      const interactions = SchedulerTracing.unstable_getCurrent();
      expect(interactions.size).toBe(1);
      interaction = Array.from(interactions)[0];

      root.render(
        <React.Suspense fallback={<Text text="Loading..." />}>
          <Async />
        </React.Suspense>,
      );

      wrappedResolve = SchedulerTracing.unstable_wrap(() => resolve());
    });

    // Render, suspend, and commit fallback
    expect(Scheduler).toFlushAndYield(['Suspend! [Async]', 'Loading...']);
    expect(element.textContent).toEqual('Loading...');

    expect(onInteractionTraced).toHaveBeenCalledTimes(1);
    expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
      interaction,
    );
    expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

    // Ping React to try rendering again
    wrappedResolve();

    // Complete the tree without committing it
    expect(Scheduler).toFlushAndYieldThrough(['Async']);
    // Still showing the fallback
    expect(element.textContent).toEqual('Loading...');

    expect(onInteractionTraced).toHaveBeenCalledTimes(1);
    expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
      interaction,
    );
    expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

    expect(Scheduler).toFlushAndYield([]);
    expect(element.textContent).toEqual('Async');

    expect(onInteractionTraced).toHaveBeenCalledTimes(1);
    expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
      interaction,
    );
    expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
  });
});
