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
let ReactCache;

function initEnvForAsyncTesting() {
  // Boilerplate copied from ReactDOMRoot-test
  // TODO pull this into helper method, reduce repetition.
  const originalDateNow = Date.now;
  global.Date.now = function() {
    return originalDateNow();
  };
  global.requestAnimationFrame = function(cb) {
    return setTimeout(() => {
      cb(Date.now());
    });
  };
  const originalAddEventListener = global.addEventListener;
  let postMessageCallback;
  global.addEventListener = function(eventName, callback, useCapture) {
    if (eventName === 'message') {
      postMessageCallback = callback;
    } else {
      originalAddEventListener(eventName, callback, useCapture);
    }
  };
  global.postMessage = function(messageKey, targetOrigin) {
    const postMessageEvent = {source: window, data: messageKey};
    if (postMessageCallback) {
      postMessageCallback(postMessageEvent);
    }
  };
}

function loadModules() {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.debugRenderPhaseSideEffects = false;
  ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
  ReactFeatureFlags.enableProfilerTimer = true;
  ReactFeatureFlags.enableSchedulerTracing = true;
  ReactFeatureFlags.enableSuspense = true;

  React = require('react');
  SchedulerTracing = require('scheduler/tracing');
  ReactDOM = require('react-dom');
  ReactCache = require('react-cache');
}

describe('ProfilerDOM', () => {
  let TextResource;
  let cache;
  let resourcePromise;
  let subscriber;

  beforeEach(() => {
    initEnvForAsyncTesting();
    loadModules();

    // Verify interaction subscriber methods are called as expected.
    subscriber = require('jest-scheduler').createMockSubscriber();
    SchedulerTracing.unstable_subscribe(subscriber);

    cache = ReactCache.createCache(() => {});

    resourcePromise = null;

    TextResource = ReactCache.createResource(([text, ms = 0]) => {
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
    TextResource.read(cache, [text, ms]);
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
        <React.Placeholder delayMS={100} fallback={<Text text="Loading..." />}>
          <AsyncText text="Text" ms={200} />
        </React.Placeholder>,
      );
      batch.then(
        SchedulerTracing.unstable_wrap(() => {
          batch.commit();

          expect(element.textContent).toBe('Loading...');
          expect(subscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(
            subscriber.onInteractionScheduledWorkCompleted,
          ).not.toHaveBeenCalled();

          resourcePromise.then(
            SchedulerTracing.unstable_wrap(() => {
              jest.runAllTimers();

              expect(element.textContent).toBe('Text');
              expect(subscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
              expect(
                subscriber.onInteractionScheduledWorkCompleted,
              ).not.toHaveBeenCalled();

              // Evaluate in an unwrapped callback,
              // Because trace/wrap won't decrement the count within the wrapped callback.
              setImmediate(() => {
                expect(subscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
                expect(
                  subscriber.onInteractionScheduledWorkCompleted,
                ).toHaveBeenCalledTimes(1);
                expect(
                  subscriber,
                ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(
                  interaction,
                );

                expect(interaction.__count).toBe(0);

                done();
              });
            }),
          );
        }),
      );
    });

    expect(subscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenLastNotifiedOfInteractionTraced(interaction);
    expect(
      subscriber.onInteractionScheduledWorkCompleted,
    ).not.toHaveBeenCalled();

    jest.runAllTimers();
  });
});
