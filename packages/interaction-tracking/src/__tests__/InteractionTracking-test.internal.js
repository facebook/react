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

    it('should report the tracked name from within the track callback', done => {
      advanceTimeBy(100);

      InteractionTracking.track('some event', () => {
        const interactions = InteractionTracking.getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      });
    });

    it('should report the tracked name from within wrapped callbacks', done => {
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

    describe('async work', () => {
      it('should always override interactions when active and restore interactions when completed', () => {
        advanceTimeBy(5);

        let asyncInteractions;
        InteractionTracking.track('old event', () => {
          asyncInteractions = InteractionTracking.getCurrent();
          InteractionTracking.__scheduleAsyncWork(asyncInteractions);
        });

        advanceTimeBy(10);
        InteractionTracking.track('new event', () => {
          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'new event', timestamp: 15},
          ]);

          InteractionTracking.__startAsyncWork(asyncInteractions);
          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'old event', timestamp: 5},
          ]);
          InteractionTracking.__stopAsyncWork(asyncInteractions, true);

          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'new event', timestamp: 15},
          ]);
        });
      });

      it('should error if async work overlaps', () => {
        let asyncInteractions;
        InteractionTracking.track('old event', () => {
          asyncInteractions = InteractionTracking.getCurrent();
          InteractionTracking.__scheduleAsyncWork(asyncInteractions);
        });

        InteractionTracking.track('new event', () => {
          InteractionTracking.__startAsyncWork(asyncInteractions);

          expect(() => {
            InteractionTracking.__startAsyncWork(asyncInteractions);
          }).toWarnDev(
            ['Can only restore one batch of async interactions at a time.'],
            {
              withoutStack: true,
            },
          );

          // It should preserve the original continuation though.
          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'old event'},
          ]);

          InteractionTracking.__stopAsyncWork(asyncInteractions);

          // And should restore the original tracked interactions afterward
          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'new event'},
          ]);
        });
      });

      it('should error if inactive async work is stopped', () => {
        expect(() => {
          InteractionTracking.__stopAsyncWork(new Set(), true);
        }).toWarnDev(['Cannot stop inactive async interactions.'], {
          withoutStack: true,
        });
      });

      it('should preserve and restore the current interactions', () => {
        let asyncInteractions;
        InteractionTracking.track('some earlier event', () => {
          asyncInteractions = InteractionTracking.getCurrent();
          InteractionTracking.__scheduleAsyncWork(asyncInteractions);
        });

        const callback = jest.fn(() => {
          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'some earlier event', timestamp: 0},
          ]);
        });

        let wrapped;
        InteractionTracking.__startAsyncWork(asyncInteractions);
        wrapped = InteractionTracking.wrap(callback);
        InteractionTracking.__stopAsyncWork(asyncInteractions, true);

        expect(callback).not.toHaveBeenCalled();
        wrapped();
        expect(callback).toHaveBeenCalled();
      });

      it('should append to the restored async interactions when track is called', () => {
        advanceTimeBy(2);

        let asyncInteractions;
        InteractionTracking.track('some earlier event', () => {
          asyncInteractions = InteractionTracking.getCurrent();
          InteractionTracking.__scheduleAsyncWork(asyncInteractions);
        });

        let innerIndirectionTracked = false;

        advanceTimeBy(3);

        InteractionTracking.track('outer event', () => {
          advanceTimeBy(7);
          InteractionTracking.__startAsyncWork(asyncInteractions);
          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'some earlier event', timestamp: 2},
          ]);

          advanceTimeBy(21);
          InteractionTracking.track('inner event', () => {
            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'some earlier event', timestamp: 2},
              // "outer event" should be masked by the continuation
              {name: 'inner event', timestamp: 33},
            ]);

            innerIndirectionTracked = true;
          });

          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'some earlier event', timestamp: 2},
          ]);
          InteractionTracking.__stopAsyncWork(asyncInteractions, true);

          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'outer event', timestamp: 5},
          ]);
        });

        expect(InteractionTracking.getCurrent()).toContainNoInteractions();
        expect(innerIndirectionTracked).toBe(true);
      });

      it('should support starting/stopping multiple async interactions in a batch', () => {
        advanceTimeBy(2);

        let asyncInteractionBatchOne;
        InteractionTracking.track('outer event one', () => {
          advanceTimeBy(3);

          InteractionTracking.track('inner event one', () => {
            asyncInteractionBatchOne = InteractionTracking.getCurrent();
            InteractionTracking.__scheduleAsyncWork(asyncInteractionBatchOne);
          });
        });

        advanceTimeBy(7);

        let asyncInteractionBatchTwo;
        InteractionTracking.track('event two', () => {
          asyncInteractionBatchTwo = InteractionTracking.getCurrent();
          InteractionTracking.__scheduleAsyncWork(asyncInteractionBatchTwo);
        });

        expect(InteractionTracking.getCurrent()).toContainNoInteractions();

        const asyncInteractions = new Set([
          ...Array.from(asyncInteractionBatchOne),
          ...Array.from(asyncInteractionBatchTwo),
        ]);
        InteractionTracking.__startAsyncWork(asyncInteractions);
        expect(InteractionTracking.getCurrent()).toMatchInteractions([
          {name: 'outer event one', timestamp: 2},
          {name: 'inner event one', timestamp: 5},
          {name: 'event two', timestamp: 12},
        ]);
        InteractionTracking.__stopAsyncWork(asyncInteractions, true);

        expect(InteractionTracking.getCurrent()).toContainNoInteractions();
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

    describe('interaction observers enabled', () => {
      let onInteractionEnded;
      let onInteractionStarting;

      const firstEvent = {id: 0, name: 'first', timestamp: 0};
      const secondEvent = {id: 1, name: 'second', timestamp: 0};

      beforeEach(() => {
        onInteractionEnded = jest.fn();
        onInteractionStarting = jest.fn();
      });

      describe('enableInteractionTrackingObserver enabled', () => {
        beforeEach(() => {
          loadModules({
            enableInteractionTracking: true,
            enableInteractionTrackingObserver: true,
          });

          InteractionTracking.registerInteractionObserver({
            onInteractionEnded,
            onInteractionStarting,
          });
        });

        it('should warn if an unscheduled interaction is started or stopped', () => {
          let interactions;
          InteractionTracking.track('some earlier event', () => {
            interactions = InteractionTracking.getCurrent();
          });

          expect(() => {
            InteractionTracking.__startAsyncWork(interactions);
          }).toWarnDev(['An unscheduled interaction was started.'], {
            withoutStack: true,
          });

          expect(() => {
            InteractionTracking.__stopAsyncWork(interactions, true);
          }).toWarnDev(['An unscheduled interaction was stopped.'], {
            withoutStack: true,
          });
        });

        it('calls lifecycle methods for track', () => {
          expect(onInteractionStarting).not.toHaveBeenCalled();
          expect(onInteractionEnded).not.toHaveBeenCalled();

          InteractionTracking.track(firstEvent.name, () => {
            expect(onInteractionStarting).toHaveBeenCalledTimes(1);
            expect(onInteractionEnded).not.toHaveBeenCalled();
            expect(onInteractionStarting).toHaveBeenLastCalledWith(firstEvent);

            InteractionTracking.track(secondEvent.name, () => {
              expect(onInteractionStarting).toHaveBeenCalledTimes(2);
              expect(onInteractionEnded).not.toHaveBeenCalled();
              expect(onInteractionStarting).toHaveBeenLastCalledWith(
                secondEvent,
              );
            });

            expect(onInteractionEnded).toHaveBeenCalledTimes(1);
            expect(onInteractionEnded).toHaveBeenLastCalledWith(secondEvent);
          });

          expect(onInteractionEnded).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded).toHaveBeenLastCalledWith(firstEvent);
        });

        it('calls lifecycle methods for wrap', () => {
          let wrappedFn;
          InteractionTracking.track(firstEvent.name, () => {
            expect(onInteractionStarting).toHaveBeenCalledTimes(1);

            InteractionTracking.track(secondEvent.name, () => {
              expect(onInteractionStarting).toHaveBeenCalledTimes(2);

              wrappedFn = InteractionTracking.wrap(fn => fn());
            });
          });

          expect(onInteractionStarting.mock.calls).toEqual([
            [firstEvent],
            [secondEvent],
          ]);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          wrappedFn(() => {
            expect(onInteractionStarting).toHaveBeenCalledTimes(2);
            expect(onInteractionEnded).not.toHaveBeenCalled();
          });

          expect(onInteractionEnded.mock.calls).toEqual([
            [firstEvent],
            [secondEvent],
          ]);
        });

        it('calls lifecycle methods for start/stop continuation', () => {
          let asyncInteractions;
          InteractionTracking.track(firstEvent.name, () => {
            InteractionTracking.track(secondEvent.name, () => {
              asyncInteractions = InteractionTracking.getCurrent();
              InteractionTracking.__scheduleAsyncWork(asyncInteractions);
            });
          });
          expect(onInteractionStarting.mock.calls).toEqual([
            [firstEvent],
            [secondEvent],
          ]);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          InteractionTracking.__startAsyncWork(asyncInteractions);
          expect(onInteractionStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          InteractionTracking.__stopAsyncWork(asyncInteractions, true);
          expect(onInteractionStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded.mock.calls).toEqual([
            [firstEvent],
            [secondEvent],
          ]);
        });

        it('calls lifecycle methods for batched continuations', () => {
          let asyncInteractionBatchOne;
          InteractionTracking.track(firstEvent.name, () => {
            asyncInteractionBatchOne = InteractionTracking.getCurrent();
            InteractionTracking.__scheduleAsyncWork(asyncInteractionBatchOne);
          });

          expect(onInteractionStarting).toHaveBeenCalledTimes(1);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          let asyncInteractionBatchTwo;
          InteractionTracking.track(secondEvent.name, () => {
            asyncInteractionBatchTwo = InteractionTracking.getCurrent();
            InteractionTracking.__scheduleAsyncWork(asyncInteractionBatchTwo);
          });

          expect(onInteractionStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          expect(InteractionTracking.getCurrent()).toContainNoInteractions();

          const asyncInteractions = new Set([
            ...Array.from(asyncInteractionBatchOne),
            ...Array.from(asyncInteractionBatchTwo),
          ]);
          InteractionTracking.__startAsyncWork(asyncInteractions);
          expect(onInteractionStarting.mock.calls).toEqual([
            [firstEvent],
            [secondEvent],
          ]);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          // Ended lifecycle should not be called if there is more work to be done,
          // i.e. if true is passed as the second param to __stopAsyncWork().
          InteractionTracking.__stopAsyncWork(asyncInteractions, false);
          expect(onInteractionStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          InteractionTracking.__startAsyncWork(asyncInteractions);
          expect(onInteractionStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          InteractionTracking.__stopAsyncWork(asyncInteractions, true);
          expect(onInteractionStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded.mock.calls).toEqual([
            [firstEvent],
            [secondEvent],
          ]);
        });

        it('cancelled work should call the correct interaction observer methods', () => {
          const fnOne = jest.fn();
          const fnTwo = jest.fn();
          let wrappedOne, wrappedTwo;
          InteractionTracking.track(firstEvent.name, () => {
            wrappedOne = InteractionTracking.wrap(fnOne);
            InteractionTracking.track(secondEvent.name, () => {
              wrappedTwo = InteractionTracking.wrap(fnTwo);
            });
          });

          expect(onInteractionStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded).not.toHaveBeenCalled();

          wrappedTwo.cancel();

          expect(onInteractionEnded).toHaveBeenCalledTimes(1);
          expect(onInteractionEnded).toHaveBeenLastCalledWith(secondEvent);

          wrappedOne.cancel();

          expect(onInteractionEnded).toHaveBeenCalledTimes(2);
          expect(onInteractionEnded).toHaveBeenLastCalledWith(firstEvent);

          expect(fnOne).not.toHaveBeenCalled();
          expect(fnTwo).not.toHaveBeenCalled();
        });

        it('should not end work twice if __start/__stop are called within track', () => {
          InteractionTracking.track(firstEvent.name, () => {
            const interactions = InteractionTracking.getCurrent();

            InteractionTracking.__scheduleAsyncWork(interactions);
            InteractionTracking.__startAsyncWork(interactions);
            InteractionTracking.__stopAsyncWork(interactions, true);

            expect(onInteractionEnded).not.toHaveBeenCalled();
          });

          expect(onInteractionEnded).toHaveBeenCalledTimes(1);
          expect(onInteractionEnded).toHaveBeenLastCalledWith(firstEvent);
        });

        it('should not end work twice if __start/__stop are called within wrap', () => {
          let wrapped;
          InteractionTracking.track(firstEvent.name, () => {
            wrapped = InteractionTracking.wrap(() => {
              const interactions = InteractionTracking.getCurrent();

              InteractionTracking.__scheduleAsyncWork(interactions);
              InteractionTracking.__startAsyncWork(interactions);
              InteractionTracking.__stopAsyncWork(interactions, true);

              expect(onInteractionEnded).not.toHaveBeenCalled();
            });
          });

          wrapped();

          expect(onInteractionEnded).toHaveBeenCalledTimes(1);
          expect(onInteractionEnded).toHaveBeenLastCalledWith(firstEvent);
        });
      });

      describe('enableInteractionTrackingObserver disabled', () => {
        beforeEach(() => {
          loadModules({
            enableInteractionTracking: true,
            enableInteractionTrackingObserver: false,
          });

          InteractionTracking.registerInteractionObserver({
            onInteractionEnded,
            onInteractionStarting,
          });
        });

        it('should not call registerted observers', () => {
          const unwrapped = jest.fn();

          let asyncInteractions;
          let wrapped;

          InteractionTracking.track(firstEvent.name, () => {
            wrapped = InteractionTracking.wrap(unwrapped);
            asyncInteractions = InteractionTracking.getCurrent();

            InteractionTracking.__scheduleAsyncWork(asyncInteractions);
          });

          wrapped();
          expect(unwrapped).toHaveBeenCalled();

          InteractionTracking.__startAsyncWork(asyncInteractions);
          InteractionTracking.__stopAsyncWork(asyncInteractions, true);

          expect(onInteractionStarting).not.toHaveBeenCalled();
          expect(onInteractionEnded).not.toHaveBeenCalled();
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
  });
});
