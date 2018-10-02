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

    const {createMockSubscriber} = require('jest-scheduler');
    firstSubscriber = createMockSubscriber();
    secondSubscriber = createMockSubscriber();

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
          firstSubscriber.onInteractionTraced.mockImplementationOnce(() => {
            throw Error('Expected error onInteractionTraced');
          });
          expect(() =>
            SchedulerTracing.unstable_trace(
              secondEvent.name,
              currentTime,
              mock,
              threadID,
            ),
          ).toThrow('Expected error onInteractionTraced');
          expect(mock).toHaveBeenCalledTimes(1);

          firstSubscriber.onWorkStarted.mockImplementationOnce(() => {
            throw Error('Expected error onWorkStarted');
          });
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

          firstSubscriber.onWorkStopped.mockImplementationOnce(() => {
            throw Error('Expected error onWorkStopped');
          });
          expect(() =>
            SchedulerTracing.unstable_trace(
              secondEvent.name,
              currentTime,
              mock,
            ),
          ).toThrow('Expected error onWorkStopped');

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

          firstSubscriber.onInteractionScheduledWorkCompleted.mockImplementationOnce(
            () => {
              throw Error('Expected error onInteractionScheduledWorkCompleted');
            },
          );
          expect(() =>
            SchedulerTracing.unstable_trace(
              secondEvent.name,
              currentTime,
              mock,
            ),
          ).toThrow('Expected error onInteractionScheduledWorkCompleted');

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
        expect(firstSubscriber.onWorkStarted).not.toHaveBeenCalled();
        expect(firstSubscriber.onWorkStopped).not.toHaveBeenCalled();

        expect(() => {
          SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
            throw Error('Expected error callback');
          });
        }).toThrow('Expected error callback');

        expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(1);
        expect(firstSubscriber.onWorkStopped).toHaveBeenCalledTimes(1);

        done();
      });

      it('should cover onWorkScheduled within wrap', done => {
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          const interaction = Array.from(
            SchedulerTracing.unstable_getCurrent(),
          )[0];
          const beforeCount = interaction.__count;

          firstSubscriber.onWorkScheduled.mockImplementationOnce(() => {
            throw Error('Expected error onWorkScheduled');
          });
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

        firstSubscriber.onWorkStarted.mockImplementationOnce(() => {
          throw Error('Expected error onWorkStarted');
        });
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

          firstSubscriber.onWorkStopped.mockImplementationOnce(() => {
            throw Error('Expected error onWorkStopped');
          });
          expect(wrapped).toThrow('Expected error onWorkStopped');

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
        expect(firstSubscriber.onWorkStarted).not.toHaveBeenCalled();
        expect(firstSubscriber.onWorkStopped).not.toHaveBeenCalled();

        let wrapped;
        let interaction;
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
          wrapped = SchedulerTracing.unstable_wrap(() => {
            throw Error('Expected error wrap');
          });
        });

        expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(1);
        expect(firstSubscriber.onWorkStopped).toHaveBeenCalledTimes(1);

        expect(wrapped).toThrow('Expected error wrap');

        expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(2);
        expect(firstSubscriber.onWorkStopped).toHaveBeenCalledTimes(2);
        expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkStopped([
          interaction,
        ]);

        done();
      });

      it('should cover onWorkCanceled within wrap', () => {
        let interaction, wrapped;
        SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
          interaction = Array.from(SchedulerTracing.unstable_getCurrent())[0];
          wrapped = SchedulerTracing.unstable_wrap(jest.fn());
        });
        expect(interaction.__count).toBe(1);

        firstSubscriber.onWorkCanceled.mockImplementationOnce(() => {
          throw Error('Expected error onWorkCanceled');
        });
        expect(wrapped.cancel).toThrow('Expected error onWorkCanceled');

        expect(firstSubscriber.onWorkCanceled).toHaveBeenCalledTimes(1);

        // It should update the interaction count so as not to interfere with subsequent calls
        expect(interaction.__count).toBe(0);
        expect(
          firstSubscriber,
        ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(
          firstEvent,
        );

        // It should call other subscribers despite the earlier error
        expect(secondSubscriber.onWorkCanceled).toHaveBeenCalledTimes(1);
      });
    });

    it('calls lifecycle methods for trace', () => {
      expect(firstSubscriber.onInteractionTraced).not.toHaveBeenCalled();
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();

      SchedulerTracing.unstable_trace(
        firstEvent.name,
        currentTime,
        () => {
          expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
          expect(firstSubscriber).toHaveBeenLastNotifiedOfInteractionTraced(
            firstEvent,
          );
          expect(
            firstSubscriber.onInteractionScheduledWorkCompleted,
          ).not.toHaveBeenCalled();
          expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(1);
          expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkStarted(
            new Set([firstEvent]),
            threadID,
          );
          expect(firstSubscriber.onWorkStopped).not.toHaveBeenCalled();

          SchedulerTracing.unstable_trace(
            secondEvent.name,
            currentTime,
            () => {
              expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(
                2,
              );
              expect(firstSubscriber).toHaveBeenLastNotifiedOfInteractionTraced(
                secondEvent,
              );
              expect(
                firstSubscriber.onInteractionScheduledWorkCompleted,
              ).not.toHaveBeenCalled();
              expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(2);
              expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkStarted(
                new Set([firstEvent, secondEvent]),
                threadID,
              );
              expect(firstSubscriber.onWorkStopped).not.toHaveBeenCalled();
            },
            threadID,
          );

          expect(
            firstSubscriber.onInteractionScheduledWorkCompleted,
          ).toHaveBeenCalledTimes(1);
          expect(
            firstSubscriber,
          ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(
            secondEvent,
          );
          expect(firstSubscriber.onWorkStopped).toHaveBeenCalledTimes(1);
          expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkStopped(
            new Set([firstEvent, secondEvent]),
            threadID,
          );
        },
        threadID,
      );

      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).toHaveBeenCalledTimes(2);
      expect(
        firstSubscriber,
      ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(firstEvent);
      expect(firstSubscriber.onWorkScheduled).not.toHaveBeenCalled();
      expect(firstSubscriber.onWorkCanceled).not.toHaveBeenCalled();
      expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(2);
      expect(firstSubscriber.onWorkStopped).toHaveBeenCalledTimes(2);
      expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkStopped(
        new Set([firstEvent]),
        threadID,
      );
    });

    it('calls lifecycle methods for wrap', () => {
      const unwrapped = jest.fn();
      let wrapped;

      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
        expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
        expect(firstSubscriber).toHaveBeenLastNotifiedOfInteractionTraced(
          firstEvent,
        );

        SchedulerTracing.unstable_trace(secondEvent.name, currentTime, () => {
          expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(2);
          expect(firstSubscriber).toHaveBeenLastNotifiedOfInteractionTraced(
            secondEvent,
          );

          wrapped = SchedulerTracing.unstable_wrap(unwrapped, threadID);
          expect(firstSubscriber.onWorkScheduled).toHaveBeenCalledTimes(1);
          expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkScheduled(
            new Set([firstEvent, secondEvent]),
            threadID,
          );
        });
      });

      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();

      wrapped();
      expect(unwrapped).toHaveBeenCalled();

      expect(firstSubscriber.onWorkScheduled).toHaveBeenCalledTimes(1);
      expect(firstSubscriber.onWorkCanceled).not.toHaveBeenCalled();
      expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(3);
      expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkStarted(
        new Set([firstEvent, secondEvent]),
        threadID,
      );
      expect(firstSubscriber.onWorkStopped).toHaveBeenCalledTimes(3);
      expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkStopped(
        new Set([firstEvent, secondEvent]),
        threadID,
      );

      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted.mock.calls[0][0],
      ).toMatchInteraction(firstEvent);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted.mock.calls[1][0],
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

      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(2);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();
      expect(firstSubscriber.onWorkCanceled).not.toHaveBeenCalled();
      expect(firstSubscriber.onWorkStarted).toHaveBeenCalledTimes(2);
      expect(firstSubscriber.onWorkStopped).toHaveBeenCalledTimes(2);

      wrappedTwo.cancel();

      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber,
      ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(secondEvent);
      expect(firstSubscriber.onWorkCanceled).toHaveBeenCalledTimes(1);
      expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkCanceled(
        new Set([firstEvent, secondEvent]),
        threadID,
      );

      wrappedOne.cancel();

      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).toHaveBeenCalledTimes(2);
      expect(
        firstSubscriber,
      ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(firstEvent);
      expect(firstSubscriber.onWorkCanceled).toHaveBeenCalledTimes(2);
      expect(firstSubscriber).toHaveBeenLastNotifiedOfWorkCanceled(
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

      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();

      wrappedOne();

      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();

      wrappedTwo();

      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber,
      ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(firstEvent);
    });

    it('should not decrement the interaction count twice if a wrapped function is run twice', () => {
      const unwrappedOne = jest.fn();
      const unwrappedTwo = jest.fn();
      let wrappedOne, wrappedTwo;
      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {
        wrappedOne = SchedulerTracing.unstable_wrap(unwrappedOne, threadID);
        wrappedTwo = SchedulerTracing.unstable_wrap(unwrappedTwo, threadID);
      });

      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();

      wrappedOne();

      expect(unwrappedOne).toHaveBeenCalledTimes(1);
      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();

      wrappedOne();

      expect(unwrappedOne).toHaveBeenCalledTimes(2);
      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).not.toHaveBeenCalled();

      wrappedTwo();

      expect(firstSubscriber.onInteractionTraced).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber.onInteractionScheduledWorkCompleted,
      ).toHaveBeenCalledTimes(1);
      expect(
        firstSubscriber,
      ).toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(firstEvent);
    });

    it('should unsubscribe', () => {
      SchedulerTracing.unstable_unsubscribe(firstSubscriber);
      SchedulerTracing.unstable_trace(firstEvent.name, currentTime, () => {});

      expect(firstSubscriber.onInteractionTraced).not.toHaveBeenCalled();
    });
  });

  describe('disabled', () => {
    beforeEach(() => loadModules({enableSchedulerTracing: false}));

    // TODO
  });
});
