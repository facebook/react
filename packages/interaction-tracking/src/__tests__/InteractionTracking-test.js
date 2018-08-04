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

  let advanceTimeBy;

  beforeEach(function() {
    jest.resetModules();
    jest.useFakeTimers();

    let currentTime = 0;
    Date.now = jest.fn().mockImplementation(() => currentTime);

    advanceTimeBy = amount => {
      currentTime += amount;
    };

    InteractionTracking = require('interaction-tracking');
  });

  it('should return a null name when outside of a tracked event', () => {
    expect(InteractionTracking.getCurrent()).toBe(null);
  });

  if (__PROFILE__) {
    describe('profiling bundle', () => {
      it('should report the tracked name from within the track callback', done => {
        advanceTimeBy(100);

        InteractionTracking.track('some event', () => {
          const interactions = InteractionTracking.getCurrent();
          expect(interactions).toEqual([
            {id: 0, name: 'some event', timestamp: 100},
          ]);

          done();
        });
      });

      it('should report the tracked name from within wrapped callbacks', done => {
        let wrappedIndirection;

        function indirection() {
          const interactions = InteractionTracking.getCurrent();
          expect(interactions).toEqual([
            {id: 0, name: 'some event', timestamp: 100},
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
          expect(interactions).toEqual([
            {id: 0, name: 'outer event', timestamp: 100},
            {id: 1, name: 'inner event', timestamp: 150},
          ]);

          innerIndirectionTracked = true;
        }

        function outerIndirection() {
          const interactions = InteractionTracking.getCurrent();
          expect(interactions).toEqual([
            {id: 0, name: 'outer event', timestamp: 100},
          ]);

          outerIndirectionTracked = true;
        }

        InteractionTracking.track('outer event', () => {
          // Verify the current tracked event
          let interactions = InteractionTracking.getCurrent();
          expect(interactions).toEqual([
            {id: 0, name: 'outer event', timestamp: 100},
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
            expect(interactions).toEqual([
              {id: 0, name: 'outer event', timestamp: 100},
              {id: 1, name: 'inner event', timestamp: 150},
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
          expect(interactions).toEqual([
            {id: 0, name: 'outer event', timestamp: 100},
          ]);

          // Verify that a wrapped nested callback is properly tracked
          wrapperInnerIndirection();
          expect(innerIndirectionTracked).toBe(true);

          done();
        });
      });

      describe('continuations', () => {
        it('should always override interactions when active and restore interactions when completed', () => {
          let continuation;

          advanceTimeBy(5);
          InteractionTracking.track('old event', () => {
            continuation = InteractionTracking.reserveContinuation();
          });

          advanceTimeBy(10);
          InteractionTracking.track('new event', () => {
            expect(InteractionTracking.getCurrent()).toEqual([
              {id: 1, name: 'new event', timestamp: 15},
            ]);

            InteractionTracking.startContinuation(continuation);
            expect(InteractionTracking.getCurrent()).toEqual(
              continuation.__interactions,
            );
            InteractionTracking.stopContinuation(continuation);

            expect(InteractionTracking.getCurrent()).toEqual([
              {id: 1, name: 'new event', timestamp: 15},
            ]);
          });
        });

        it('should error if started or stopped multiple times', () => {
          let continuation;
          InteractionTracking.track('some event', () => {
            continuation = InteractionTracking.reserveContinuation();
          });

          InteractionTracking.startContinuation(continuation);
          expect(() => {
            InteractionTracking.startContinuation(continuation);
          }).toThrow('Cannot start a continuation when one is already active.');

          InteractionTracking.stopContinuation(continuation);
          expect(() => {
            InteractionTracking.stopContinuation(continuation);
          }).toThrow('Cannot stop a continuation that is not active.');
        });

        it('should wrap the current continuation if there is one', () => {
          let continuation;
          InteractionTracking.track('some event', () => {
            continuation = InteractionTracking.reserveContinuation();
          });

          const callback = jest.fn(() => {
            expect(InteractionTracking.getCurrent()).toBe(
              continuation.__interactions,
            );
          });

          let wrapped;
          InteractionTracking.startContinuation(continuation);
          wrapped = InteractionTracking.wrap(callback);
          InteractionTracking.stopContinuation(continuation);

          expect(callback).not.toHaveBeenCalled();
          wrapped();
          expect(callback).toHaveBeenCalled();
        });

        it('should extend interactions within the current continutation when track is called', () => {
          advanceTimeBy(2);

          let continuation;
          InteractionTracking.track('original event', () => {
            continuation = InteractionTracking.reserveContinuation();
          });

          let innerIndirectionTracked = false;

          advanceTimeBy(3);

          InteractionTracking.track('outer event', () => {
            advanceTimeBy(7);
            InteractionTracking.startContinuation(continuation);
            expect(InteractionTracking.getCurrent()).toEqual([
              {id: 0, name: 'original event', timestamp: 2},
            ]);

            advanceTimeBy(21);
            InteractionTracking.track('inner event', () => {
              expect(InteractionTracking.getCurrent()).toEqual([
                {id: 0, name: 'original event', timestamp: 2},
                // "outer event" should be masked by the continuation
                {id: 2, name: 'inner event', timestamp: 33},
              ]);

              innerIndirectionTracked = true;
            });

            expect(InteractionTracking.getCurrent()).toEqual([
              {id: 0, name: 'original event', timestamp: 2},
            ]);
            InteractionTracking.stopContinuation(continuation);

            expect(InteractionTracking.getCurrent()).toEqual([
              {id: 1, name: 'outer event', timestamp: 5},
            ]);
          });

          expect(InteractionTracking.getCurrent()).toBe(null);
          expect(innerIndirectionTracked).toBe(true);
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

            const interactions = InteractionTracking.getCurrent();
            expect(interactions).toEqual([
              {id: 0, name: 'outer event', timestamp: 100},
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

            const interactions = InteractionTracking.getCurrent();
            expect(interactions).toEqual([
              {id: 0, name: 'outer event', timestamp: 100},
            ]);

            done();
          });
        });

        it('should reset state appropriately when an error occurs in a retracked callback', done => {
          let expiredInteractions;

          advanceTimeBy(2);
          InteractionTracking.track('outer event', () => {
            advanceTimeBy(5);
            InteractionTracking.track('inner event', () => {
              expiredInteractions = InteractionTracking.getCurrent();
            });
          });

          advanceTimeBy(3);

          InteractionTracking.track('new event', () => {
            expect(() => {
              InteractionTracking.retrack(expiredInteractions, () => {
                throw Error('expected error');
              });
            });

            const interactions = InteractionTracking.getCurrent();
            expect(interactions).toEqual([
              {id: 2, name: 'new event', timestamp: 10},
            ]);

            done();
          });
        });
      });

      describe('InteractionInteractionsEmitter lifecycle', () => {
        let onInteractionsScheduled;
        let onInteractionsStarting;
        let onInteractionsEnded;

        const firstEvent = {
          id: 0,
          name: 'first',
          timestamp: 0,
        };
        const secondEvent = {
          id: 1,
          name: 'second',
          timestamp: 0,
        };

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

          InteractionTracking.track('first', () => {
            expect(onInteractionsScheduled).toHaveBeenCalledTimes(1);
            expect(onInteractionsStarting).toHaveBeenCalledTimes(1);
            expect(onInteractionsEnded).not.toHaveBeenCalled();
            expect(onInteractionsScheduled).toHaveBeenLastCalledWith(
              [firstEvent],
              0,
            );
            expect(onInteractionsStarting).toHaveBeenLastCalledWith(
              [firstEvent],
              0,
            );

            InteractionTracking.track('second', () => {
              expect(onInteractionsScheduled).toHaveBeenCalledTimes(2);
              expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
              expect(onInteractionsEnded).not.toHaveBeenCalled();
              expect(onInteractionsScheduled).toHaveBeenLastCalledWith(
                [firstEvent, secondEvent],
                1,
              );
              expect(onInteractionsStarting).toHaveBeenLastCalledWith(
                [firstEvent, secondEvent],
                1,
              );
            });

            expect(onInteractionsEnded).toHaveBeenCalledTimes(1);
            expect(onInteractionsEnded).toHaveBeenLastCalledWith(
              [firstEvent, secondEvent],
              1,
            );
          });

          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenLastCalledWith([firstEvent], 0);
        });

        it('Calls lifecycle methods for wrap', () => {
          let wrappedFn;
          InteractionTracking.track('first', () => {
            InteractionTracking.track('second', () => {
              wrappedFn = InteractionTracking.wrap(fn => fn());

              expect(onInteractionsScheduled).toHaveBeenLastCalledWith(
                [firstEvent, secondEvent],
                2,
              );
            });
          });

          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);

          wrappedFn(() => {
            expect(onInteractionsStarting).toHaveBeenCalledTimes(3);
            expect(onInteractionsStarting).toHaveBeenLastCalledWith(
              [firstEvent, secondEvent],
              2,
            );
            expect(onInteractionsEnded).toHaveBeenCalledTimes(2);
          });

          expect(onInteractionsEnded).toHaveBeenCalledTimes(3);
          expect(onInteractionsEnded).toHaveBeenLastCalledWith(
            [firstEvent, secondEvent],
            2,
          );
        });

        it('Calls lifecycle methods for start/stop continuation', () => {
          let settableContext;
          InteractionTracking.track('first', () => {
            InteractionTracking.track('second', () => {
              settableContext = InteractionTracking.reserveContinuation();
            });
          });
          expect(onInteractionsStarting).toHaveBeenCalledTimes(2);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);

          expect(onInteractionsScheduled.mock.calls.length).toBe(3);
          expect(onInteractionsScheduled).toHaveBeenLastCalledWith(
            [firstEvent, secondEvent],
            2,
          );

          InteractionTracking.startContinuation(settableContext);
          expect(onInteractionsStarting).toHaveBeenCalledTimes(3);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(2);

          InteractionTracking.stopContinuation(settableContext);
          expect(onInteractionsEnded).toHaveBeenCalledTimes(3);

          expect(onInteractionsStarting).toHaveBeenLastCalledWith(
            [firstEvent, secondEvent],
            2,
          );
          expect(onInteractionsEnded).toHaveBeenLastCalledWith(
            [firstEvent, secondEvent],
            2,
          );
        });
      });
    });
  } else {
    describe('production bundle', () => {
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
  }
});
