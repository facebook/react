/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('InteractionTracking', () => {
  let InteractionTracking;
  let ReactFeatureFlags;

  let advanceTimeBy;

  function loadModules({
    enableInteractionTracking,
    enableInteractionTrackingObserver,
  }) {
    jest.resetModules();
    jest.useFakeTimers();

    let currentTime = 0;
    Date.now = jest.fn().mockImplementation(() => currentTime);

    advanceTimeBy = amount => {
      currentTime += amount;
    };

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableInteractionTracking = enableInteractionTracking;
    ReactFeatureFlags.enableInteractionTrackingObserver = enableInteractionTrackingObserver;

    InteractionTracking = require('interaction-tracking');
  }

  describe('enableInteractionTracking enabled', () => {
    beforeEach(() => loadModules({enableInteractionTracking: true}));

    it('should return the value of a tracked function', () => {
      expect(InteractionTracking.track('arbitrary', () => 123)).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      InteractionTracking.track('arbitrary', () => {
        wrapped = InteractionTracking.wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should return an empty set when outside of a tracked event', () => {
      expect(InteractionTracking.getCurrent()).toContainNoInteractions();
    });

    it('should report the tracked interaction from within the track callback', done => {
      advanceTimeBy(100);

      InteractionTracking.track('some event', () => {
        const interactions = InteractionTracking.getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      });
    });

    it('should report the tracked interaction from within wrapped callbacks', done => {
      let wrappedIndirection;

      function indirection() {
        const interactions = InteractionTracking.getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      }

      advanceTimeBy(100);

      InteractionTracking.track('some event', () => {
        wrappedIndirection = InteractionTracking.wrap(indirection);
      });

      advanceTimeBy(50);

      wrappedIndirection();
    });

    it('should support nested tracked events', done => {
      advanceTimeBy(100);

      let innerIndirectionTracked = false;
      let outerIndirectionTracked = false;

      function innerIndirection() {
        const interactions = InteractionTracking.getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
          {name: 'inner event', timestamp: 150},
        ]);

        innerIndirectionTracked = true;
      }

      function outerIndirection() {
        const interactions = InteractionTracking.getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        outerIndirectionTracked = true;
      }

      InteractionTracking.track('outer event', () => {
        // Verify the current tracked event
        let interactions = InteractionTracking.getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        advanceTimeBy(50);

        const wrapperOuterIndirection = InteractionTracking.wrap(
          outerIndirection,
        );

        let wrapperInnerIndirection;
        let innerEventTracked = false;

        // Verify that a nested event is properly tracked
        InteractionTracking.track('inner event', () => {
          interactions = InteractionTracking.getCurrent();
          expect(interactions).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
            {name: 'inner event', timestamp: 150},
          ]);

          // Verify that a wrapped outer callback is properly tracked
          wrapperOuterIndirection();
          expect(outerIndirectionTracked).toBe(true);

          wrapperInnerIndirection = InteractionTracking.wrap(innerIndirection);

          innerEventTracked = true;
        });

        expect(innerEventTracked).toBe(true);

        // Verify that the original event is restored
        interactions = InteractionTracking.getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        // Verify that a wrapped nested callback is properly tracked
        wrapperInnerIndirection();
        expect(innerIndirectionTracked).toBe(true);

        done();
      });
    });

    describe('error handling', () => {
      it('should reset state appropriately when an error occurs in a track callback', done => {
        advanceTimeBy(100);

        InteractionTracking.track('outer event', () => {
          expect(() => {
            InteractionTracking.track('inner event', () => {
              throw Error('intentional');
            });
          }).toThrow();

          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
          ]);

          done();
        });
      });

      it('should reset state appropriately when an error occurs in a wrapped callback', done => {
        advanceTimeBy(100);

        InteractionTracking.track('outer event', () => {
          let wrappedCallback;

          InteractionTracking.track('inner event', () => {
            wrappedCallback = InteractionTracking.wrap(() => {
              throw Error('intentional');
            });
          });

          expect(wrappedCallback).toThrow();

          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
          ]);

          done();
        });
      });
    });

    describe('advanced integration', () => {
      it('should expose the current set of interactions to be externally manipulated', () => {
        InteractionTracking.track('outer event', () => {
          expect(InteractionTracking.__interactionsRef.current).toBe(
            InteractionTracking.getCurrent(),
          );

          InteractionTracking.__interactionsRef.current = new Set([
            {name: 'override event'},
          ]);

          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'override event'},
          ]);
        });
      });
    });

    describe('interaction observers enabled', () => {
      let onInteractionScheduledWorkCompleted;
      let onInteractionTracked;
      let onWorkCancelled;
      let onWorkScheduled;
      let onWorkStarted;
      let onWorkStopped;
      let subscriber;

      const firstEvent = {id: 0, name: 'first', timestamp: 0};
      const secondEvent = {id: 1, name: 'second', timestamp: 0};
      const threadID = 123;

      beforeEach(() => {
        onInteractionScheduledWorkCompleted = jest.fn();
        onInteractionTracked = jest.fn();
        onWorkCancelled = jest.fn();
        onWorkScheduled = jest.fn();
        onWorkStarted = jest.fn();
        onWorkStopped = jest.fn();
      });

      describe('enableInteractionTrackingObserver enabled', () => {
        beforeEach(() => {
          loadModules({
            enableInteractionTracking: true,
            enableInteractionTrackingObserver: true,
          });

          subscriber = {
            onInteractionScheduledWorkCompleted,
            onInteractionTracked,
            onWorkCancelled,
            onWorkScheduled,
            onWorkStarted,
            onWorkStopped,
          };

          InteractionTracking.subscribe(subscriber);
        });

        it('calls lifecycle methods for track', () => {
          expect(onInteractionTracked).not.toHaveBeenCalled();
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

          InteractionTracking.track(
            firstEvent.name,
            () => {
              expect(onInteractionTracked).toHaveBeenCalledTimes(1);
              expect(onInteractionTracked).toHaveBeenLastCalledWith(firstEvent);
              expect(
                onInteractionScheduledWorkCompleted,
              ).not.toHaveBeenCalled();
              expect(onWorkStarted).toHaveBeenCalledTimes(1);
              expect(onWorkStarted).toHaveBeenLastCalledWith(
                new Set([firstEvent]),
                threadID,
              );
              expect(onWorkStopped).not.toHaveBeenCalled();

              InteractionTracking.track(
                secondEvent.name,
                () => {
                  expect(onInteractionTracked).toHaveBeenCalledTimes(2);
                  expect(onInteractionTracked).toHaveBeenLastCalledWith(
                    secondEvent,
                  );
                  expect(
                    onInteractionScheduledWorkCompleted,
                  ).not.toHaveBeenCalled();
                  expect(onWorkStarted).toHaveBeenCalledTimes(2);
                  expect(onWorkStarted).toHaveBeenLastCalledWith(
                    new Set([firstEvent, secondEvent]),
                    threadID,
                  );
                  expect(onWorkStopped).not.toHaveBeenCalled();
                },
                threadID,
              );

              expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(
                1,
              );
              expect(
                onInteractionScheduledWorkCompleted,
              ).toHaveBeenLastCalledWith(secondEvent);
              expect(onWorkStopped).toHaveBeenCalledTimes(1);
              expect(onWorkStopped).toHaveBeenLastCalledWith(
                new Set([firstEvent, secondEvent]),
                threadID,
              );
            },
            threadID,
          );

          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenLastCalledWith(
            firstEvent,
          );
          expect(onWorkScheduled).not.toHaveBeenCalled();
          expect(onWorkCancelled).not.toHaveBeenCalled();
          expect(onWorkStarted).toHaveBeenCalledTimes(2);
          expect(onWorkStopped).toHaveBeenCalledTimes(2);
          expect(onWorkStopped).toHaveBeenLastCalledWith(
            new Set([firstEvent]),
            threadID,
          );
        });

        it('calls lifecycle methods for wrap', () => {
          const unwrapped = jest.fn();
          let wrapped;

          InteractionTracking.track(firstEvent.name, () => {
            expect(onInteractionTracked).toHaveBeenCalledTimes(1);
            expect(onInteractionTracked).toHaveBeenLastCalledWith(firstEvent);

            InteractionTracking.track(secondEvent.name, () => {
              expect(onInteractionTracked).toHaveBeenCalledTimes(2);
              expect(onInteractionTracked).toHaveBeenLastCalledWith(
                secondEvent,
              );

              wrapped = InteractionTracking.wrap(unwrapped, threadID);
              expect(onWorkScheduled).toHaveBeenCalledTimes(1);
              expect(onWorkScheduled).toHaveBeenLastCalledWith(
                new Set([firstEvent, secondEvent]),
                threadID,
              );
            });
          });

          expect(onInteractionTracked).toHaveBeenCalledTimes(2);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

          wrapped();
          expect(unwrapped).toHaveBeenCalled();

          expect(onWorkScheduled).toHaveBeenCalledTimes(1);
          expect(onWorkCancelled).not.toHaveBeenCalled();
          expect(onWorkStarted).toHaveBeenCalledTimes(3);
          expect(onWorkStarted).toHaveBeenLastCalledWith(
            new Set([firstEvent, secondEvent]),
            threadID,
          );
          expect(onWorkStopped).toHaveBeenCalledTimes(3);
          expect(onWorkStopped).toHaveBeenLastCalledWith(
            new Set([firstEvent, secondEvent]),
            threadID,
          );

          expect(onInteractionScheduledWorkCompleted.mock.calls).toEqual([
            [firstEvent],
            [secondEvent],
          ]);
        });

        it('should call the correct interaction observer methods when a wrapped callback is cancelled', () => {
          const fnOne = jest.fn();
          const fnTwo = jest.fn();
          let wrappedOne, wrappedTwo;
          InteractionTracking.track(firstEvent.name, () => {
            wrappedOne = InteractionTracking.wrap(fnOne, threadID);
            InteractionTracking.track(secondEvent.name, () => {
              wrappedTwo = InteractionTracking.wrap(fnTwo, threadID);
            });
          });

          expect(onInteractionTracked).toHaveBeenCalledTimes(2);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
          expect(onWorkCancelled).not.toHaveBeenCalled();
          expect(onWorkStarted).toHaveBeenCalledTimes(2);
          expect(onWorkStopped).toHaveBeenCalledTimes(2);

          wrappedTwo.cancel();

          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenLastCalledWith(
            secondEvent,
          );
          expect(onWorkCancelled).toHaveBeenCalledTimes(1);
          expect(onWorkCancelled).toHaveBeenLastCalledWith(
            new Set([firstEvent, secondEvent]),
            threadID,
          );

          wrappedOne.cancel();

          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(2);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenLastCalledWith(
            firstEvent,
          );
          expect(onWorkCancelled).toHaveBeenCalledTimes(2);
          expect(onWorkCancelled).toHaveBeenLastCalledWith(
            new Set([firstEvent]),
            threadID,
          );

          expect(fnOne).not.toHaveBeenCalled();
          expect(fnTwo).not.toHaveBeenCalled();
        });

        it('should not end an interaction twice if wrap is used to schedule follow up work within another wrap', () => {
          const fnOne = jest.fn(() => {
            wrappedTwo = InteractionTracking.wrap(fnTwo, threadID);
          });
          const fnTwo = jest.fn();
          let wrappedOne, wrappedTwo;
          InteractionTracking.track(firstEvent.name, () => {
            wrappedOne = InteractionTracking.wrap(fnOne, threadID);
          });

          expect(onInteractionTracked).toHaveBeenCalledTimes(1);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

          wrappedOne();

          expect(onInteractionTracked).toHaveBeenCalledTimes(1);
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

          wrappedTwo();

          expect(onInteractionTracked).toHaveBeenCalledTimes(1);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
          expect(onInteractionScheduledWorkCompleted).toHaveBeenLastCalledWith(
            firstEvent,
          );
        });

        it('should unsubscribe', () => {
          InteractionTracking.unsubscribe(subscriber);
          InteractionTracking.track(firstEvent.name, () => {});

          expect(onInteractionTracked).not.toHaveBeenCalled();
        });

        describe('advanced integration', () => {
          it('should return a unique threadID per request', () => {
            expect(InteractionTracking.getThreadID()).not.toBe(
              InteractionTracking.getThreadID(),
            );
          });

          it('should expose the current set of interaction observers to be called externally', () => {
            const observer = Array.from(
              InteractionTracking.__subscribers,
            )[0];
            expect(observer.onInteractionTracked).toBe(onInteractionTracked);
          });

          it('should expose the count of pending scheduled async work for external manipulation', () => {
            expect(
              Array.from(InteractionTracking.__scheduledAsyncWorkCounts),
            ).toHaveLength(0);

            let interactions;
            InteractionTracking.track('some event', () => {
              InteractionTracking.wrap(jest.fn());
              interactions = InteractionTracking.getCurrent();
            });

            expect(
              Array.from(InteractionTracking.__scheduledAsyncWorkCounts),
            ).toHaveLength(1);
            expect(
              Array.from(InteractionTracking.__scheduledAsyncWorkCounts.keys()),
            ).toEqual(Array.from(interactions));
          });
        });
      });

      describe('enableInteractionTrackingObserver disabled', () => {
        beforeEach(() => {
          loadModules({
            enableInteractionTracking: true,
            enableInteractionTrackingObserver: false,
          });

          InteractionTracking.subscribe(subscriber);
        });

        it('should not call registerted observers', () => {
          const unwrapped = jest.fn();
          let wrapped;
          InteractionTracking.track(firstEvent.name, () => {
            wrapped = InteractionTracking.wrap(unwrapped);
          });

          wrapped();
          expect(unwrapped).toHaveBeenCalled();

          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();
          expect(onInteractionTracked).not.toHaveBeenCalled();
          expect(onWorkCancelled).not.toHaveBeenCalled();
          expect(onWorkScheduled).not.toHaveBeenCalled();
          expect(onWorkStarted).not.toHaveBeenCalled();
          expect(onWorkStopped).not.toHaveBeenCalled();
        });

        describe('advanced integration', () => {
          it('should not create unnecessary objects', () => {
            expect(InteractionTracking.__subscribers).toBe(null);
            expect(InteractionTracking.__scheduledAsyncWorkCounts).toBe(null);
          });
        });
      });
    });
  });

  describe('enableInteractionTracking disabled', () => {
    beforeEach(() => loadModules({enableInteractionTracking: false}));

    it('should return the value of a tracked function', () => {
      expect(InteractionTracking.track('arbitrary', () => 123)).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      InteractionTracking.track('arbitrary', () => {
        wrapped = InteractionTracking.wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should return null for tracked interactions', () => {
      expect(InteractionTracking.getCurrent()).toBe(null);
    });

    it('should execute tracked callbacks', done => {
      InteractionTracking.track('some event', () => {
        expect(InteractionTracking.getCurrent()).toBe(null);

        done();
      });
    });

    it('should execute wrapped callbacks', done => {
      const wrappedCallback = InteractionTracking.wrap(() => {
        expect(InteractionTracking.getCurrent()).toBe(null);

        done();
      });

      wrappedCallback();
    });

    describe('advanced integration', () => {
      it('should not create unnecessary objects', () => {
        expect(InteractionTracking.__interactionsRef).toBe(null);
      });
    });
  });
});
