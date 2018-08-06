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

  function loadModules({enableProfilerTimer}) {
    jest.resetModules();
    jest.useFakeTimers();

    let currentTime = 0;
    Date.now = jest.fn().mockImplementation(() => currentTime);

    advanceTimeBy = amount => {
      currentTime += amount;
    };

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableProfilerTimer = enableProfilerTimer;
    InteractionTracking = require('interaction-tracking');
  }

  describe('enableProfilerTimer enabled', () => {
    beforeEach(() => loadModules({enableProfilerTimer: true}));

    it('should return an empty set when outside of a tracked event', () => {
      expect(InteractionTracking.getCurrent()).toContainNoInteractions();
    });

    describe('profiling bundle', () => {
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

            wrapperInnerIndirection = InteractionTracking.wrap(
              innerIndirection,
            );

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

      describe('continuations', () => {
        it('should always override interactions when active and restore interactions when completed', () => {
          advanceTimeBy(5);

          const continuations = new Map();
          InteractionTracking.track('old event', () => {
            const interaction = Array.from(InteractionTracking.getCurrent())[0];
            continuations.set(
              InteractionTracking.reserveContinuation(interaction),
              interaction,
            );
          });

          advanceTimeBy(10);
          InteractionTracking.track('new event', () => {
            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'new event', timestamp: 15},
            ]);

            InteractionTracking.startContinuations(continuations);
            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'old event', timestamp: 5},
            ]);
            InteractionTracking.stopContinuations(continuations);

            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'new event', timestamp: 15},
            ]);
          });
        });

        it('should error if started or stopped multiple times', () => {
          const continuations = new Map();
          InteractionTracking.track('some earlier event', () => {
            const interaction = Array.from(InteractionTracking.getCurrent())[0];
            continuations.set(
              InteractionTracking.reserveContinuation(interaction),
              interaction,
            );
          });

          InteractionTracking.startContinuations(continuations);
          expect(() => {
            InteractionTracking.startContinuations(continuations);
          }).toWarnDev(
            [
              'Only one batch of continuations can be active at a time.',
              'Cannot run an unscheduled continuation',
            ],
            {withoutStack: true},
          );

          InteractionTracking.stopContinuations(continuations);
          expect(() => {
            InteractionTracking.stopContinuations(continuations);
          }).toWarnDev('Cannot stop an inactive continuation.', {
            withoutStack: true,
          });
        });

        it('should wrap the current continuation if there is one', () => {
          const continuations = new Map();
          InteractionTracking.track('some earlier event', () => {
            const interaction = Array.from(InteractionTracking.getCurrent())[0];
            continuations.set(
              InteractionTracking.reserveContinuation(interaction),
              interaction,
            );
          });

          const callback = jest.fn(() => {
            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'some earlier event', timestamp: 0},
            ]);
          });

          let wrapped;
          InteractionTracking.startContinuations(continuations);
          wrapped = InteractionTracking.wrap(callback);
          InteractionTracking.stopContinuations(continuations);

          expect(callback).not.toHaveBeenCalled();
          wrapped();
          expect(callback).toHaveBeenCalled();
        });

        it('should extend interactions within the current continutation when track is called', () => {
          advanceTimeBy(2);

          const continuations = new Map();
          InteractionTracking.track('some earlier event', () => {
            const interaction = Array.from(InteractionTracking.getCurrent())[0];
            continuations.set(
              InteractionTracking.reserveContinuation(interaction),
              interaction,
            );
          });

          let innerIndirectionTracked = false;

          advanceTimeBy(3);

          InteractionTracking.track('outer event', () => {
            advanceTimeBy(7);
            InteractionTracking.startContinuations(continuations);
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
            InteractionTracking.stopContinuations(continuations);

            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'outer event', timestamp: 5},
            ]);
          });

          expect(InteractionTracking.getCurrent()).toContainNoInteractions();
          expect(innerIndirectionTracked).toBe(true);
        });

        it('should support starting/stopping multiple reserved continuations in batch', () => {
          advanceTimeBy(2);

          const continuations = new Map();
          InteractionTracking.track('outer event one', () => {
            advanceTimeBy(3);

            InteractionTracking.track('inner event one', () => {
              const interactions = Array.from(InteractionTracking.getCurrent());
              continuations.set(
                InteractionTracking.reserveContinuation(interactions[0]),
                interactions[0],
              );
              continuations.set(
                InteractionTracking.reserveContinuation(interactions[1]),
                interactions[1],
              );
            });
          });

          advanceTimeBy(7);

          InteractionTracking.track('event two', () => {
            const interactions = Array.from(InteractionTracking.getCurrent());
            continuations.set(
              InteractionTracking.reserveContinuation(interactions[0]),
              interactions[0],
            );
          });

          expect(InteractionTracking.getCurrent()).toContainNoInteractions();

          InteractionTracking.startContinuations(continuations);
          expect(InteractionTracking.getCurrent()).toMatchInteractions([
            {name: 'outer event one', timestamp: 2},
            {name: 'inner event one', timestamp: 5},
            {name: 'event two', timestamp: 12},
          ]);
          InteractionTracking.stopContinuations(continuations);

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

      describe('InteractionEmitter', () => {
        let onInteractionsScheduled;
        let onInteractionsStarting;
        let onInteractionsEnded;

        const firstEvent = {name: 'first'};
        const secondEvent = {name: 'second'};

        beforeEach(() => {
          onInteractionsScheduled = jest.fn();
          onInteractionsStarting = jest.fn();
          onInteractionsEnded = jest.fn();

          InteractionTracking.registerInteractionObserver({
            onInteractionsScheduled,
            onInteractionsStarting,
            onInteractionsEnded,
          });
        });

        it('Calls lifecycle methods for track', () => {
          expect(onInteractionsScheduled).not.toHaveBeenCalled();
          expect(onInteractionsStarting).not.toHaveBeenCalled();
          expect(onInteractionsEnded).not.toHaveBeenCalled();

          InteractionTracking.track(firstEvent.name, () => {
            expect(onInteractionsScheduled).toHaveBeenCalledTimes(1);
            expect(onInteractionsStarting).toHaveBeenCalledTimes(1);
            expect(onInteractionsEnded).not.toHaveBeenCalled();
            expect(
              onInteractionsScheduled,
            ).toHaveBeenLastCalledWithInteractions([firstEvent], 0);
            expect(onInteractionsStarting).toHaveBeenLastCalledWithInteractions(
              [firstEvent],
              0,
            );

            InteractionTracking.track(secondEvent.name, () => {
              expect(onInteractionsScheduled).toHaveBeenCalledTimes(2);
              expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
              expect(onInteractionsEnded).not.toHaveBeenCalled();
              expect(
                onInteractionsScheduled,
              ).toHaveBeenLastCalledWithInteractions(
                [firstEvent, secondEvent],
                1,
              );
              expect(
                onInteractionsStarting,
              ).toHaveBeenLastCalledWithInteractions(
                [firstEvent, secondEvent],
                1,
              );
            });

            expect(onInteractionsEnded).toHaveBeenCalledTimes(1);
            expect(onInteractionsEnded).toHaveBeenLastCalledWithInteractions(
              [firstEvent, secondEvent],
              1,
            );
          });

          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenLastCalledWithInteractions(
            [firstEvent],
            0,
          );
        });

        it('Calls lifecycle methods for wrap', () => {
          let wrappedFn;
          InteractionTracking.track(firstEvent.name, () => {
            InteractionTracking.track(secondEvent.name, () => {
              wrappedFn = InteractionTracking.wrap(fn => fn());

              expect(
                onInteractionsScheduled,
              ).toHaveBeenLastCalledWithInteractions(
                [firstEvent, secondEvent],
                2,
              );
            });
          });

          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);

          wrappedFn(() => {
            expect(onInteractionsStarting).toHaveBeenCalledTimes(3);
            expect(onInteractionsStarting).toHaveBeenLastCalledWithInteractions(
              [firstEvent, secondEvent],
              2,
            );
            expect(onInteractionsEnded).toHaveBeenCalledTimes(2);
          });

          expect(onInteractionsEnded).toHaveBeenCalledTimes(3);
          expect(onInteractionsEnded).toHaveBeenLastCalledWithInteractions(
            [firstEvent, secondEvent],
            2,
          );
        });

        it('calls lifecycle methods for start/stop continuation', () => {
          const continuations = new Map();
          InteractionTracking.track(firstEvent.name, () => {
            InteractionTracking.track(secondEvent.name, () => {
              const interactions = Array.from(InteractionTracking.getCurrent());
              continuations.set(
                InteractionTracking.reserveContinuation(interactions[0]),
                interactions[0],
              );
              expect(onInteractionsScheduled.mock.calls.length).toBe(3);
              expect(
                onInteractionsScheduled,
              ).toHaveBeenLastCalledWithInteractions([firstEvent], 2);

              continuations.set(
                InteractionTracking.reserveContinuation(interactions[1]),
                interactions[1],
              );
              expect(onInteractionsScheduled.mock.calls.length).toBe(4);
              expect(
                onInteractionsScheduled,
              ).toHaveBeenLastCalledWithInteractions([secondEvent], 3);
            });
          });
          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);

          onInteractionsStarting.mockClear();
          onInteractionsEnded.mockClear();

          InteractionTracking.startContinuations(continuations);
          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(0);
          expect(onInteractionsStarting).toHaveBeenCalledWithInteractions(
            0,
            [firstEvent],
            2,
          );
          expect(onInteractionsStarting).toHaveBeenCalledWithInteractions(
            1,
            [secondEvent],
            3,
          );

          InteractionTracking.stopContinuations(continuations);
          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledWithInteractions(
            0,
            [secondEvent],
            3,
          );
          expect(onInteractionsEnded).toHaveBeenCalledWithInteractions(
            1,
            [firstEvent],
            2,
          );
        });

        it('calls lifecycle methods for batched continuations', () => {
          const continuations = new Map();
          InteractionTracking.track(firstEvent.name, () => {
            const interaction = Array.from(InteractionTracking.getCurrent())[0];
            continuations.set(
              InteractionTracking.reserveContinuation(interaction),
              interaction,
            );
          });

          expect(onInteractionsScheduled).toHaveBeenCalledTimes(2);
          expect(onInteractionsStarting).toHaveBeenCalledTimes(1);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(1);

          InteractionTracking.track(secondEvent.name, () => {
            const interaction = Array.from(InteractionTracking.getCurrent())[0];
            continuations.set(
              InteractionTracking.reserveContinuation(interaction),
              interaction,
            );
          });

          expect(onInteractionsScheduled).toHaveBeenCalledTimes(4);
          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);

          onInteractionsScheduled.mockClear();
          onInteractionsStarting.mockClear();
          onInteractionsEnded.mockClear();

          expect(InteractionTracking.getCurrent()).toContainNoInteractions();

          InteractionTracking.startContinuations(continuations);

          expect(onInteractionsScheduled).not.toHaveBeenCalled();
          expect(onInteractionsStarting).toHaveBeenCalledWithInteractions(
            0,
            [firstEvent],
            1,
          );
          expect(onInteractionsStarting).toHaveBeenCalledWithInteractions(
            1,
            [secondEvent],
            3,
          );

          expect(onInteractionsEnded).not.toHaveBeenCalled();

          InteractionTracking.stopContinuations(continuations);

          expect(onInteractionsScheduled).not.toHaveBeenCalled();
          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledWithInteractions(
            0,
            [secondEvent],
            3,
          );
          expect(onInteractionsEnded).toHaveBeenCalledWithInteractions(
            1,
            [firstEvent],
            1,
          );
        });
      });
    });
  });

  describe('enableProfilerTimer disabled', () => {
    beforeEach(() => loadModules({enableProfilerTimer: false}));

    describe('production bundle', () => {
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
});
