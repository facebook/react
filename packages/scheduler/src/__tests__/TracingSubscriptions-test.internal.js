/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('TracingSubscriptions', () => {
  let SchedulerTracing;
  let ReactFeatureFlags;

  let currentTime;

  let onInteractionScheduledWorkCompleted;
  let onInteractionTraced;
  let onWorkCanceled;
  let onWorkScheduled;
  let onWorkStarted;
  let onWorkStopped;
  let throwInOnInteractionScheduledWorkCompleted;
  let throwInOnInteractionTraced;
  let throwInOnWorkCanceled;
  let throwInOnWorkScheduled;
  let throwInOnWorkStarted;
  let throwInOnWorkStopped;
  let firstSubscriber;
  let secondSubscriber;

  const firstEvent = {id: 0, name: 'first', timestamp: 0};
  const secondEvent = {id: 1, name: 'second', timestamp: 0};
  const threadID = 123;

  function loadModules({enableSchedulerTracing, autoSubscribe = true}) {
    jest.resetModules();
    jest.useFakeTimers();

    currentTime = 0;

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSchedulerTracing = enableSchedulerTracing;

    SchedulerTracing = require('scheduler/tracing');

    throwInOnInteractionScheduledWorkCompleted = false;
    throwInOnInteractionTraced = false;
    throwInOnWorkCanceled = false;
    throwInOnWorkScheduled = false;
    throwInOnWorkStarted = false;
    throwInOnWorkStopped = false;

    onInteractionScheduledWorkCompleted = jest.fn(() => {
      if (throwInOnInteractionScheduledWorkCompleted) {
        throw Error('Expected error onInteractionScheduledWorkCompleted');
      }
    });
    onInteractionTraced = jest.fn(() => {
      if (throwInOnInteractionTraced) {
        throw Error('Expected error onInteractionTraced');
      }
    });
    onWorkCanceled = jest.fn(() => {
      if (throwInOnWorkCanceled) {
        throw Error('Expected error onWorkCanceled');
      }
    });
    onWorkScheduled = jest.fn(() => {
      if (throwInOnWorkScheduled) {
        throw Error('Expected error onWorkScheduled');
      }
    });
    onWorkStarted = jest.fn(() => {
      if (throwInOnWorkStarted) {
        throw Error('Expected error onWorkStarted');
      }
    });
    onWorkStopped = jest.fn(() => {
      if (throwInOnWorkStopped) {
        throw Error('Expected error onWorkStopped');
      }
    });

    firstSubscriber = {
      onInteractionScheduledWorkCompleted,
      onInteractionTraced,
      onWorkCanceled,
      onWorkScheduled,
      onWorkStarted,
      onWorkStopped,
    };

    secondSubscriber = {
      onInteractionScheduledWorkCompleted: jest.fn(),
      onInteractionTraced: jest.fn(),
      onWorkCanceled: jest.fn(),
      onWorkScheduled: jest.fn(),
      onWorkStarted: jest.fn(),
      onWorkStopped: jest.fn(),
    };

    if (autoSubscribe) {
      SchedulerTracing.unstable_subscribe(firstSubscriber);
      SchedulerTracing.unstable_subscribe(secondSubscriber);
    }
  }

  describe('enabled', () => {
    beforeEach(() => loadModules({enableSchedulerTracing: true}));

    it('should lazily subscribe to tracing and unsubscribe again if there are no external subscribers', () => {
      loadModules({enableSchedulerTracing: true, autoSubscribe: false});

      expect(SchedulerTracing.__subscriberRef.current).toBe(null);
      SchedulerTracing.unstable_subscribe(firstSubscriber);
      expect(SchedulerTracing.__subscriberRef.current).toBeDefined();
      SchedulerTracing.unstable_subscribe(secondSubscriber);
      expect(SchedulerTracing.__subscriberRef.current).toBeDefined();
      SchedulerTracing.unstable_unsubscribe(secondSubscriber);
      expect(SchedulerTracing.__subscriberRef.current).toBeDefined();
      SchedulerTracing.unstable_unsubscribe(firstSubscriber);
      expect(SchedulerTracing.__subscriberRef.current).toBe(null);
    });

    describe('error handling', () => {
      it('should cover onInteractionTraced/onWorkStarted within', done => {
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          const mock = jest.fn();

          // It should call the callback before re-throwing
          throwInOnInteractionTraced = true;
          expect(() =>
            SchedulerTracing.unstable_trace(
              secondEvent.name,
              currentTime,
              mock,
              threadID,
            ),
          ).toThrow('Expected error onInteractionTraced');
          throwInOnInteractionTraced = false;
          expect(mock).toHaveBeenCalledTimes(1);

          throwInOnWorkStarted = true;
          expect(() =>
            SchedulerTracing.unstable_trace(
              secondEvent.name,
              currentTime,
              mock,
              threadID,
            ),
          ).toThrow('Expected error onWorkStarted');
          expect(mock).toHaveBeenCalledTimes(2);

          // It should restore the previous/outer interactions
          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            firstEvent,
          ]);

          // It should call other subscribers despite the earlier error
          expect(secondSubscriber.onInteractionTraced).toHaveBeenCalledTimes(3);
          expect(secondSubscriber.onWorkStarted).toHaveBeenCalledTimes(3);

          done();
        });
      });

      it('should cover onWorkStopped within trace', done => {
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          let innerInteraction;
          const mock = jest.fn(() => {
            innerInteraction = Array.from(
              SchedulerTracing.unstable_getCurrent(),
            )[1];
          });

          throwInOnWorkStopped = true;
          expect(() =>
            SchedulerTracing.unstable_trace(
              secondEvent.name,
              currentTime,
              mock,
            ),
          ).toThrow('Expected error onWorkStopped');
          throwInOnWorkStopped = false;

          // It should restore the previous/outer interactions
          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            firstEvent,
          ]);

          // It should update the interaction count so as not to interfere with subsequent calls
          expect(innerInteraction.__count).toBe(0);

          // It should call other subscribers despite the earlier error
          expect(secondSubscriber.onWorkStopped).toHaveBeenCalledTimes(1);

          done();
        });
      });

      it('should cover onInteractionScheduledWorkCompleted within trace', done => {
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          const mock = jest.fn();

          throwInOnInteractionScheduledWorkCompleted = true;
          expect(() =>
            SchedulerTracing.unstable_trace(
              secondEvent.name,
              currentTime,
              mock,
            ),
          ).toThrow('Expected error onInteractionScheduledWorkCompleted');
          throwInOnInteractionScheduledWorkCompleted = false;

          // It should restore the previous/outer interactions
          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            firstEvent,
          ]);

          // It should call other subscribers despite the earlier error
          expect(
            secondSubscriber.onInteractionScheduledWorkCompleted,
          ).toHaveBeenCalledTimes(1);

          done();
        });
      });

      it('should cover the callback within trace', done => {
        expect(onWorkStarted).not.toHaveBeenCalled();
        expect(onWorkStopped).not.toHaveBeenCalled();

        expect(() => {
          SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
            throw Error('Expected error callback');
          });
        }).toThrow('Expected error callback');

        expect(onWorkStarted).toHaveBeenCalledTimes(1);
        expect(onWorkStopped).toHaveBeenCalledTimes(1);

        done();
      });

      it('should cover onWorkScheduled within wrap', done => {
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          const interaction = Array.from(
            SchedulerTracing.unstable_getCurrent(),
          )[0];
          const beforeCount = interaction.__count;

          throwInOnWorkScheduled = true;
          expect(() => SchedulerTracing.unstable_wrap(() => {})).toThrow(
            'Expected error onWorkScheduled',
          );

          // It should not update the interaction count so as not to interfere with subsequent calls
          expect(interaction.__count).toBe(beforeCount);

          // It should call other subscribers despite the earlier error
          expect(secondSubscriber.onWorkScheduled).toHaveBeenCalledTimes(1);

          done();
        });
      });

      it('should cover onWorkStarted within wrap', () => {
        const mock = jest.fn();
        let interaction, wrapped;
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
          wrapped = SchedulerTracing.unstable_wrap(mock);
        });
        expect(interaction.__count).toBe(1);

        throwInOnWorkStarted = true;
        expect(wrapped).toThrow('Expected error onWorkStarted');

        // It should call the callback before re-throwing
        expect(mock).toHaveBeenCalledTimes(1);

        // It should update the interaction count so as not to interfere with subsequent calls
        expect(interaction.__count).toBe(0);

        // It should call other subscribers despite the earlier error
        expect(secondSubscriber.onWorkStarted).toHaveBeenCalledTimes(2);
      });

      it('should cover onWorkStopped within wrap', done => {
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          const outerInteraction = Array.from(
            SchedulerTracing.unstable_getCurrent(),
          )[0];
          expect(outerInteraction.__count).toBe(1);

          let wrapped;
          let innerInteraction;

          SchedulerTracing.unstable_trace(secondEvent.name, currentTime, () => {
            innerInteraction = Array.from(
              SchedulerTracing.unstable_getCurrent(),
            )[1];
            expect(outerInteraction.__count).toBe(1);
            expect(innerInteraction.__count).toBe(1);

            wrapped = SchedulerTracing.unstable_wrap(jest.fn());
            expect(outerInteraction.__count).toBe(2);
            expect(innerInteraction.__count).toBe(2);
          });

          expect(outerInteraction.__count).toBe(2);
          expect(innerInteraction.__count).toBe(1);

          throwInOnWorkStopped = true;
          expect(wrapped).toThrow('Expected error onWorkStopped');
          throwInOnWorkStopped = false;

          // It should restore the previous interactions
          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            outerInteraction,
          ]);

          // It should update the interaction count so as not to interfere with subsequent calls
          expect(outerInteraction.__count).toBe(1);
          expect(innerInteraction.__count).toBe(0);

          expect(secondSubscriber.onWorkStopped).toHaveBeenCalledTimes(2);

          done();
        });
      });

      it('should cover the callback within wrap', done => {
        expect(onWorkStarted).not.toHaveBeenCalled();
        expect(onWorkStopped).not.toHaveBeenCalled();

        let wrapped;
        let interaction;
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
          wrapped = SchedulerTracing.unstable_wrap(() => {
            throw Error('Expected error wrap');
          });
        });

        expect(onWorkStarted).toHaveBeenCalledTimes(1);
        expect(onWorkStopped).toHaveBeenCalledTimes(1);

        expect(wrapped).toThrow('Expected error wrap');

        expect(onWorkStarted).toHaveBeenCalledTimes(2);
        expect(onWorkStopped).toHaveBeenCalledTimes(2);
        expect(onWorkStopped).toHaveBeenLastNotifiedOfWork([interaction]);

        done();
      });

      it('should cover onWorkCanceled within wrap', () => {
        let interaction, wrapped;
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
          wrapped = SchedulerTracing.unstable_wrap(jest.fn());
        });
        expect(interaction.__count).toBe(1);

        throwInOnWorkCanceled = true;
        expect(wrapped.cancel).toThrow('Expected error onWorkCanceled');

        expect(onWorkCanceled).toHaveBeenCalledTimes(1);

        // It should update the interaction count so as not to interfere with subsequent calls
        expect(interaction.__count).toBe(0);
        expect(
          onInteractionScheduledWorkCompleted,
        ).toHaveBeenLastNotifiedOfInteraction(firstEvent);

        // It should call other subscribers despite the earlier error
        expect(secondSubscriber.onWorkCanceled).toHaveBeenCalledTimes(1);
      });
    });

    it('calls lifecycle methods for trace', () => {
      expect(onInteractionTraced).not.toHaveBeenCalled();
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      SchedulerTracing.unstable_trace(
        firstEvent.name,
        currentTime,
        () => {
          expect(onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
            firstEvent,
          );
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
          expect(onWorkStarted).toHaveBeenCalledTimes(1);
          expect(onWorkStarted).toHaveBeenLastNotifiedOfWork(
            new Set([firstEvent]),
            threadID,
          );
          expect(onWorkStopped).not.toHaveBeenCalled();

          SchedulerTracing.unstable_trace(
            secondEvent.name,
            currentTime,
            () => {
              expect(onInteractionTraced).toHaveBeenCalledTimes(2);
              expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
                secondEvent,
              );
              expect(
                onInteractionScheduledWorkCompleted,
              ).not.toHaveBeenCalled();
              expect(onWorkStarted).toHaveBeenCalledTimes(2);
              expect(onWorkStarted).toHaveBeenLastNotifiedOfWork(
                new Set([firstEvent, secondEvent]),
                threadID,
              );
              expect(onWorkStopped).not.toHaveBeenCalled();
            },
            threadID,
          );

          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(
            onInteractionScheduledWorkCompleted,
          ).toHaveBeenLastNotifiedOfInteraction(secondEvent);
          expect(onWorkStopped).toHaveBeenCalledTimes(1);
          expect(onWorkStopped).toHaveBeenLastNotifiedOfWork(
            new Set([firstEvent, secondEvent]),
            threadID,
          );
        },
        threadID,
      );

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(firstEvent);
      expect(onWorkScheduled).not.toHaveBeenCalled();
      expect(onWorkCanceled).not.toHaveBeenCalled();
      expect(onWorkStarted).toHaveBeenCalledTimes(2);
      expect(onWorkStopped).toHaveBeenCalledTimes(2);
      expect(onWorkStopped).toHaveBeenLastNotifiedOfWork(
        new Set([firstEvent]),
        threadID,
      );
    });

    it('calls lifecycle methods for wrap', () => {
      const unwrapped = jest.fn();
      let wrapped;

      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
        expect(onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
          firstEvent,
        );

        SchedulerTracing.unstable_trace(secondEvent.name, currentTime, () => {
          expect(onInteractionTraced).toHaveBeenCalledTimes(2);
          expect(onInteractionTraced).toHaveBeenLastNotifiedOfInteraction(
            secondEvent,
          );

          wrapped = SchedulerTracing.unstable_wrap(unwrapped, threadID);
          expect(onWorkScheduled).toHaveBeenCalledTimes(1);
          expect(onWorkScheduled).toHaveBeenLastNotifiedOfWork(
            new Set([firstEvent, secondEvent]),
            threadID,
          );
        });
      });

      expect(onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      wrapped();
      expect(unwrapped).toHaveBeenCalled();

      expect(onWorkScheduled).toHaveBeenCalledTimes(1);
      expect(onWorkCanceled).not.toHaveBeenCalled();
      expect(onWorkStarted).toHaveBeenCalledTimes(3);
      expect(onWorkStarted).toHaveBeenLastNotifiedOfWork(
        new Set([firstEvent, secondEvent]),
        threadID,
      );
      expect(onWorkStopped).toHaveBeenCalledTimes(3);
      expect(onWorkStopped).toHaveBeenLastNotifiedOfWork(
        new Set([firstEvent, secondEvent]),
        threadID,
      );

      expect(
        onInteractionScheduledWorkCompleted.mock.calls[0][0],
      ).toMatchInteraction(firstEvent);
      expect(
        onInteractionScheduledWorkCompleted.mock.calls[1][0],
      ).toMatchInteraction(secondEvent);
    });

    it('should call the correct interaction subscriber methods when a wrapped callback is canceled', () => {
      const fnOne = jest.fn();
      const fnTwo = jest.fn();
      let wrappedOne, wrappedTwo;
      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
        wrappedOne = SchedulerTracing.unstable_wrap(fnOne, threadID);
        SchedulerTracing.unstable_trace(secondEvent.name, currentTime, () => {
          wrappedTwo = SchedulerTracing.unstable_wrap(fnTwo, threadID);
        });
      });

      expect(onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
      expect(onWorkCanceled).not.toHaveBeenCalled();
      expect(onWorkStarted).toHaveBeenCalledTimes(2);
      expect(onWorkStopped).toHaveBeenCalledTimes(2);

      wrappedTwo.cancel();

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(secondEvent);
      expect(onWorkCanceled).toHaveBeenCalledTimes(1);
      expect(onWorkCanceled).toHaveBeenLastNotifiedOfWork(
        new Set([firstEvent, secondEvent]),
        threadID,
      );

      wrappedOne.cancel();

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(firstEvent);
      expect(onWorkCanceled).toHaveBeenCalledTimes(2);
      expect(onWorkCanceled).toHaveBeenLastNotifiedOfWork(
        new Set([firstEvent]),
        threadID,
      );

      expect(fnOne).not.toHaveBeenCalled();
      expect(fnTwo).not.toHaveBeenCalled();
    });

    it('should not end an interaction twice if wrap is used to schedule follow up work within another wrap', () => {
      const fnOne = jest.fn(() => {
        wrappedTwo = SchedulerTracing.unstable_wrap(fnTwo, threadID);
      });
      const fnTwo = jest.fn();
      let wrappedOne, wrappedTwo;
      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
        wrappedOne = SchedulerTracing.unstable_wrap(fnOne, threadID);
      });

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      wrappedOne();

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      wrappedTwo();

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(firstEvent);
    });

    it('should not decrement the interaction count twice if a wrapped function is run twice', () => {
      const unwrappedOne = jest.fn();
      const unwrappedTwo = jest.fn();
      let wrappedOne, wrappedTwo;
      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
        wrappedOne = SchedulerTracing.unstable_wrap(unwrappedOne, threadID);
        wrappedTwo = SchedulerTracing.unstable_wrap(unwrappedTwo, threadID);
      });

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      wrappedOne();

      expect(unwrappedOne).toHaveBeenCalledTimes(1);
      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      wrappedOne();

      expect(unwrappedOne).toHaveBeenCalledTimes(2);
      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

      wrappedTwo();

      expect(onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(
        onInteractionScheduledWorkCompleted,
      ).toHaveBeenLastNotifiedOfInteraction(firstEvent);
    });

    it('should unsubscribe', () => {
      SchedulerTracing.unstable_unsubscribe(firstSubscriber);
      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {});

      expect(onInteractionTraced).not.toHaveBeenCalled();
    });
  });

  describe('disabled', () => {
    beforeEach(() => loadModules({enableSchedulerTracing: false}));

    // TODO
  });
});
