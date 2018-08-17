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
  let currentTime;

  function loadModules({
    enableInteractionTracking,
    enableInteractionTrackingObserver,
  }) {
    jest.resetModules();
    jest.useFakeTimers();

    currentTime = 0;
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
      expect(
        InteractionTracking.track('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a clear function', () => {
      expect(InteractionTracking.clear(() => 123)).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      InteractionTracking.track('arbitrary', currentTime, () => {
        wrapped = InteractionTracking.wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should return an empty set when outside of a tracked event', () => {
      expect(InteractionTracking.getCurrent()).toContainNoInteractions();
    });

    it('should report the tracked interaction from within the track callback', done => {
      advanceTimeBy(100);

      InteractionTracking.track('some event', currentTime, () => {
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

      InteractionTracking.track('some event', currentTime, () => {
        wrappedIndirection = InteractionTracking.wrap(indirection);
      });

      advanceTimeBy(50);

      wrappedIndirection();
    });

    it('should clear the interaction stack for tracked callbacks', () => {
      let innerTestReached = false;

      InteractionTracking.track('outer event', currentTime, () => {
        expect(InteractionTracking.getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        InteractionTracking.clear(() => {
          expect(InteractionTracking.getCurrent()).toMatchInteractions([]);

          InteractionTracking.track('inner event', currentTime, () => {
            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'inner event'},
            ]);

            innerTestReached = true;
          });
        });

        expect(InteractionTracking.getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      expect(innerTestReached).toBe(true);
    });

    it('should clear the interaction stack for wrapped callbacks', () => {
      let innerTestReached = false;
      let wrappedIndirection;

      const indirection = jest.fn(() => {
        expect(InteractionTracking.getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        InteractionTracking.clear(() => {
          expect(InteractionTracking.getCurrent()).toMatchInteractions([]);

          InteractionTracking.track('inner event', currentTime, () => {
            expect(InteractionTracking.getCurrent()).toMatchInteractions([
              {name: 'inner event'},
            ]);

            innerTestReached = true;
          });
        });

        expect(InteractionTracking.getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      InteractionTracking.track('outer event', currentTime, () => {
        wrappedIndirection = InteractionTracking.wrap(indirection);
      });

      wrappedIndirection();

      expect(innerTestReached).toBe(true);
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

      InteractionTracking.track('outer event', currentTime, () => {
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
        InteractionTracking.track('inner event', currentTime, () => {
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

        InteractionTracking.track('outer event', currentTime, () => {
          expect(() => {
            InteractionTracking.track('inner event', currentTime, () => {
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

        InteractionTracking.track('outer event', currentTime, () => {
          let wrappedCallback;

          InteractionTracking.track('inner event', currentTime, () => {
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
        InteractionTracking.track('outer event', currentTime, () => {
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

    describe('interaction subscribers enabled', () => {
      let onInteractionScheduledWorkCompleted;
      let onInteractionTracked;
      let onWorkCanceled;
      let onWorkScheduled;
      let onWorkStarted;
      let onWorkStopped;
      let subscriber;
      let throwInOnInteractionScheduledWorkCompleted;
      let throwInOnInteractionTracked;
      let throwInOnWorkCanceled;
      let throwInOnWorkScheduled;
      let throwInOnWorkStarted;
      let throwInOnWorkStopped;

      const firstEvent = {id: 0, name: 'first', timestamp: 0};
      const secondEvent = {id: 1, name: 'second', timestamp: 0};
      const threadID = 123;

      beforeEach(() => {
        throwInOnInteractionScheduledWorkCompleted = false;
        throwInOnInteractionTracked = false;
        throwInOnWorkCanceled = false;
        throwInOnWorkScheduled = false;
        throwInOnWorkStarted = false;
        throwInOnWorkStopped = false;

        onInteractionScheduledWorkCompleted = jest.fn(() => {
          if (throwInOnInteractionScheduledWorkCompleted) {
            throw Error('Expected error onInteractionScheduledWorkCompleted');
          }
        });
        onInteractionTracked = jest.fn(() => {
          if (throwInOnInteractionTracked) {
            throw Error('Expected error onInteractionTracked');
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
            onWorkCanceled,
            onWorkScheduled,
            onWorkStarted,
            onWorkStopped,
          };

          InteractionTracking.__subscriberRef.current = subscriber;
        });

        it('should return the value of a tracked function', () => {
          expect(
            InteractionTracking.track('arbitrary', currentTime, () => 123),
          ).toBe(123);
        });

        it('should return the value of a wrapped function', () => {
          let wrapped;
          InteractionTracking.track('arbitrary', currentTime, () => {
            wrapped = InteractionTracking.wrap(() => 123);
          });
          expect(wrapped()).toBe(123);
        });

        describe('error handling', () => {
          it('should cover onInteractionTracked/onWorkStarted within', done => {
            InteractionTracking.track(firstEvent.name, currentTime, () => {
              const mock = jest.fn();

              // It should call the callback before re-throwing
              throwInOnInteractionTracked = true;
              expect(() =>
                InteractionTracking.track(
                  secondEvent.name,
                  currentTime,
                  mock,
                  threadID,
                ),
              ).toThrow('Expected error onInteractionTracked');
              throwInOnInteractionTracked = false;
              expect(mock).toHaveBeenCalledTimes(1);

              throwInOnWorkStarted = true;
              expect(() =>
                InteractionTracking.track(
                  secondEvent.name,
                  currentTime,
                  mock,
                  threadID,
                ),
              ).toThrow('Expected error onWorkStarted');
              expect(mock).toHaveBeenCalledTimes(2);

              // It should restore the previous/outer interactions
              expect(InteractionTracking.getCurrent()).toMatchInteractions([
                firstEvent,
              ]);

              done();
            });
          });

          it('should cover onWorkStopped within track', done => {
            InteractionTracking.track(firstEvent.name, currentTime, () => {
              let innerInteraction;
              const mock = jest.fn(() => {
                innerInteraction = Array.from(
                  InteractionTracking.getCurrent(),
                )[1];
              });

              throwInOnWorkStopped = true;
              expect(() =>
                InteractionTracking.track(secondEvent.name, currentTime, mock),
              ).toThrow('Expected error onWorkStopped');
              throwInOnWorkStopped = false;

              // It should restore the previous/outer interactions
              expect(InteractionTracking.getCurrent()).toMatchInteractions([
                firstEvent,
              ]);

              // It should update the interaction count so as not to interfere with subsequent calls
              expect(innerInteraction.__count).toBe(0);

              done();
            });
          });

          it('should cover the callback within track', done => {
            expect(onWorkStarted).not.toHaveBeenCalled();
            expect(onWorkStopped).not.toHaveBeenCalled();

            expect(() => {
              InteractionTracking.track(firstEvent.name, currentTime, () => {
                throw Error('Expected error callback');
              });
            }).toThrow('Expected error callback');

            expect(onWorkStarted).toHaveBeenCalledTimes(1);
            expect(onWorkStopped).toHaveBeenCalledTimes(1);

            done();
          });

          it('should cover onWorkScheduled within wrap', done => {
            InteractionTracking.track(firstEvent.name, currentTime, () => {
              const interaction = Array.from(
                InteractionTracking.getCurrent(),
              )[0];
              const beforeCount = interaction.__count;

              throwInOnWorkScheduled = true;
              expect(() => InteractionTracking.wrap(() => {})).toThrow(
                'Expected error onWorkScheduled',
              );

              // It should not update the interaction count so as not to interfere with subsequent calls
              expect(interaction.__count).toBe(beforeCount);

              done();
            });
          });

          it('should cover onWorkStarted within wrap', () => {
            const mock = jest.fn();
            let interaction, wrapped;
            InteractionTracking.track(firstEvent.name, currentTime, () => {
              interaction = Array.from(InteractionTracking.getCurrent())[0];
              wrapped = InteractionTracking.wrap(mock);
            });
            expect(interaction.__count).toBe(1);

            throwInOnWorkStarted = true;
            expect(wrapped).toThrow('Expected error onWorkStarted');

            // It should call the callback before re-throwing
            expect(mock).toHaveBeenCalledTimes(1);

            // It should update the interaction count so as not to interfere with subsequent calls
            expect(interaction.__count).toBe(0);
          });

          it('should cover onWorkStopped within wrap', done => {
            InteractionTracking.track(firstEvent.name, currentTime, () => {
              const outerInteraction = Array.from(
                InteractionTracking.getCurrent(),
              )[0];
              expect(outerInteraction.__count).toBe(1);

              let wrapped;
              let innerInteraction;

              InteractionTracking.track(secondEvent.name, currentTime, () => {
                innerInteraction = Array.from(
                  InteractionTracking.getCurrent(),
                )[1];
                expect(outerInteraction.__count).toBe(1);
                expect(innerInteraction.__count).toBe(1);

                wrapped = InteractionTracking.wrap(jest.fn());
                expect(outerInteraction.__count).toBe(2);
                expect(innerInteraction.__count).toBe(2);
              });

              expect(outerInteraction.__count).toBe(2);
              expect(innerInteraction.__count).toBe(1);

              throwInOnWorkStopped = true;
              expect(wrapped).toThrow('Expected error onWorkStopped');
              throwInOnWorkStopped = false;

              // It should restore the previous interactions
              expect(InteractionTracking.getCurrent()).toMatchInteractions([
                outerInteraction,
              ]);

              // It should update the interaction count so as not to interfere with subsequent calls
              expect(outerInteraction.__count).toBe(1);
              expect(innerInteraction.__count).toBe(0);

              done();
            });
          });

          it('should cover the callback within wrap', done => {
            expect(onWorkStarted).not.toHaveBeenCalled();
            expect(onWorkStopped).not.toHaveBeenCalled();

            let wrapped;
            let interaction;
            InteractionTracking.track(firstEvent.name, currentTime, () => {
              interaction = Array.from(InteractionTracking.getCurrent())[0];
              wrapped = InteractionTracking.wrap(() => {
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
            InteractionTracking.track(firstEvent.name, currentTime, () => {
              interaction = Array.from(InteractionTracking.getCurrent())[0];
              wrapped = InteractionTracking.wrap(jest.fn());
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
          });
        });

        it('calls lifecycle methods for track', () => {
          expect(onInteractionTracked).not.toHaveBeenCalled();
          expect(onInteractionScheduledWorkCompleted).not.toHaveBeenCalled();

          InteractionTracking.track(
            firstEvent.name,
            currentTime,
            () => {
              expect(onInteractionTracked).toHaveBeenCalledTimes(1);
              expect(onInteractionTracked).toHaveBeenLastNotifiedOfInteraction(
                firstEvent,
              );
              expect(
                onInteractionScheduledWorkCompleted,
              ).not.toHaveBeenCalled();
              expect(onWorkStarted).toHaveBeenCalledTimes(1);
              expect(onWorkStarted).toHaveBeenLastNotifiedOfWork(
                new Set([firstEvent]),
                threadID,
              );
              expect(onWorkStopped).not.toHaveBeenCalled();

              InteractionTracking.track(
                secondEvent.name,
                currentTime,
                () => {
                  expect(onInteractionTracked).toHaveBeenCalledTimes(2);
                  expect(
                    onInteractionTracked,
                  ).toHaveBeenLastNotifiedOfInteraction(secondEvent);
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

              expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(
                1,
              );
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

          InteractionTracking.track(firstEvent.name, currentTime, () => {
            expect(onInteractionTracked).toHaveBeenCalledTimes(1);
            expect(onInteractionTracked).toHaveBeenLastNotifiedOfInteraction(
              firstEvent,
            );

            InteractionTracking.track(secondEvent.name, currentTime, () => {
              expect(onInteractionTracked).toHaveBeenCalledTimes(2);
              expect(onInteractionTracked).toHaveBeenLastNotifiedOfInteraction(
                secondEvent,
              );

              wrapped = InteractionTracking.wrap(unwrapped, threadID);
              expect(onWorkScheduled).toHaveBeenCalledTimes(1);
              expect(onWorkScheduled).toHaveBeenLastNotifiedOfWork(
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
          InteractionTracking.track(firstEvent.name, currentTime, () => {
            wrappedOne = InteractionTracking.wrap(fnOne, threadID);
            InteractionTracking.track(secondEvent.name, currentTime, () => {
              wrappedTwo = InteractionTracking.wrap(fnTwo, threadID);
            });
          });

          expect(onInteractionTracked).toHaveBeenCalledTimes(2);
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
            wrappedTwo = InteractionTracking.wrap(fnTwo, threadID);
          });
          const fnTwo = jest.fn();
          let wrappedOne, wrappedTwo;
          InteractionTracking.track(firstEvent.name, currentTime, () => {
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
          expect(
            onInteractionScheduledWorkCompleted,
          ).toHaveBeenLastNotifiedOfInteraction(firstEvent);
        });

        it('should unsubscribe', () => {
          InteractionTracking.__subscriberRef.current = null;
          InteractionTracking.track(firstEvent.name, currentTime, () => {});

          expect(onInteractionTracked).not.toHaveBeenCalled();
        });

        describe('advanced integration', () => {
          it('should return a unique threadID per request', () => {
            expect(InteractionTracking.getThreadID()).not.toBe(
              InteractionTracking.getThreadID(),
            );
          });

          it('should expose the current set of interaction subscribers to be called externally', () => {
            expect(
              InteractionTracking.__subscriberRef.current.onInteractionTracked,
            ).toBe(onInteractionTracked);
          });
        });
      });

      describe('enableInteractionTrackingObserver disabled', () => {
        beforeEach(() => {
          loadModules({
            enableInteractionTracking: true,
            enableInteractionTrackingObserver: false,
          });
        });

        it('should not create unnecessary objects', () => {
          expect(InteractionTracking.__subscriberRef).toBe(null);
        });
      });
    });
  });

  describe('enableInteractionTracking disabled', () => {
    beforeEach(() => loadModules({enableInteractionTracking: false}));

    it('should return the value of a tracked function', () => {
      expect(
        InteractionTracking.track('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      InteractionTracking.track('arbitrary', currentTime, () => {
        wrapped = InteractionTracking.wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should return null for tracked interactions', () => {
      expect(InteractionTracking.getCurrent()).toBe(null);
    });

    it('should execute tracked callbacks', done => {
      InteractionTracking.track('some event', currentTime, () => {
        expect(InteractionTracking.getCurrent()).toBe(null);

        done();
      });
    });

    it('should return the value of a clear function', () => {
      expect(InteractionTracking.clear(() => 123)).toBe(123);
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
