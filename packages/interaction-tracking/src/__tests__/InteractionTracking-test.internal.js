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

  function loadModules({enableInteractionTracking}) {
    jest.resetModules();
    jest.useFakeTimers();

    currentTime = 0;
    Date.now = jest.fn().mockImplementation(() => currentTime);

    advanceTimeBy = amount => {
      currentTime += amount;
    };

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableInteractionTracking = enableInteractionTracking;

    InteractionTracking = require('interaction-tracking');
  }

  describe('enableInteractionTracking enabled', () => {
    beforeEach(() => loadModules({enableInteractionTracking: true}));

    it('should return the value of a tracked function', () => {
      expect(
        InteractionTracking.unstable_track('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a clear function', () => {
      expect(InteractionTracking.unstable_clear(() => 123)).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      InteractionTracking.unstable_track('arbitrary', currentTime, () => {
        wrapped = InteractionTracking.unstable_wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should pass arguments through to a wrapped function', done => {
      let wrapped;
      InteractionTracking.unstable_track('arbitrary', currentTime, () => {
        wrapped = InteractionTracking.unstable_wrap((param1, param2) => {
          expect(param1).toBe('foo');
          expect(param2).toBe('bar');
          done();
        });
      });
      wrapped('foo', 'bar');
    });

    it('should return an empty set when outside of a tracked event', () => {
      expect(
        InteractionTracking.unstable_getCurrent(),
      ).toContainNoInteractions();
    });

    it('should report the tracked interaction from within the track callback', done => {
      advanceTimeBy(100);

      InteractionTracking.unstable_track('some event', currentTime, () => {
        const interactions = InteractionTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      });
    });

    it('should report the tracked interaction from within wrapped callbacks', done => {
      let wrappedIndirection;

      function indirection() {
        const interactions = InteractionTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      }

      advanceTimeBy(100);

      InteractionTracking.unstable_track('some event', currentTime, () => {
        wrappedIndirection = InteractionTracking.unstable_wrap(indirection);
      });

      advanceTimeBy(50);

      wrappedIndirection();
    });

    it('should clear the interaction stack for tracked callbacks', () => {
      let innerTestReached = false;

      InteractionTracking.unstable_track('outer event', currentTime, () => {
        expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        InteractionTracking.unstable_clear(() => {
          expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions(
            [],
          );

          InteractionTracking.unstable_track('inner event', currentTime, () => {
            expect(
              InteractionTracking.unstable_getCurrent(),
            ).toMatchInteractions([{name: 'inner event'}]);

            innerTestReached = true;
          });
        });

        expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      expect(innerTestReached).toBe(true);
    });

    it('should clear the interaction stack for wrapped callbacks', () => {
      let innerTestReached = false;
      let wrappedIndirection;

      const indirection = jest.fn(() => {
        expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        InteractionTracking.unstable_clear(() => {
          expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions(
            [],
          );

          InteractionTracking.unstable_track('inner event', currentTime, () => {
            expect(
              InteractionTracking.unstable_getCurrent(),
            ).toMatchInteractions([{name: 'inner event'}]);

            innerTestReached = true;
          });
        });

        expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      InteractionTracking.unstable_track('outer event', currentTime, () => {
        wrappedIndirection = InteractionTracking.unstable_wrap(indirection);
      });

      wrappedIndirection();

      expect(innerTestReached).toBe(true);
    });

    it('should support nested tracked events', done => {
      advanceTimeBy(100);

      let innerIndirectionTracked = false;
      let outerIndirectionTracked = false;

      function innerIndirection() {
        const interactions = InteractionTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
          {name: 'inner event', timestamp: 150},
        ]);

        innerIndirectionTracked = true;
      }

      function outerIndirection() {
        const interactions = InteractionTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        outerIndirectionTracked = true;
      }

      InteractionTracking.unstable_track('outer event', currentTime, () => {
        // Verify the current tracked event
        let interactions = InteractionTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        advanceTimeBy(50);

        const wrapperOuterIndirection = InteractionTracking.unstable_wrap(
          outerIndirection,
        );

        let wrapperInnerIndirection;
        let innerEventTracked = false;

        // Verify that a nested event is properly tracked
        InteractionTracking.unstable_track('inner event', currentTime, () => {
          interactions = InteractionTracking.unstable_getCurrent();
          expect(interactions).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
            {name: 'inner event', timestamp: 150},
          ]);

          // Verify that a wrapped outer callback is properly tracked
          wrapperOuterIndirection();
          expect(outerIndirectionTracked).toBe(true);

          wrapperInnerIndirection = InteractionTracking.unstable_wrap(
            innerIndirection,
          );

          innerEventTracked = true;
        });

        expect(innerEventTracked).toBe(true);

        // Verify that the original event is restored
        interactions = InteractionTracking.unstable_getCurrent();
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

        InteractionTracking.unstable_track('outer event', currentTime, () => {
          expect(() => {
            InteractionTracking.unstable_track(
              'inner event',
              currentTime,
              () => {
                throw Error('intentional');
              },
            );
          }).toThrow();

          expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions(
            [{name: 'outer event', timestamp: 100}],
          );

          done();
        });
      });

      it('should reset state appropriately when an error occurs in a wrapped callback', done => {
        advanceTimeBy(100);

        InteractionTracking.unstable_track('outer event', currentTime, () => {
          let wrappedCallback;

          InteractionTracking.unstable_track('inner event', currentTime, () => {
            wrappedCallback = InteractionTracking.unstable_wrap(() => {
              throw Error('intentional');
            });
          });

          expect(wrappedCallback).toThrow();

          expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions(
            [{name: 'outer event', timestamp: 100}],
          );

          done();
        });
      });
    });

    describe('advanced integration', () => {
      it('should return a unique threadID per request', () => {
        expect(InteractionTracking.unstable_getThreadID()).not.toBe(
          InteractionTracking.unstable_getThreadID(),
        );
      });

      it('should expose the current set of interactions to be externally manipulated', () => {
        InteractionTracking.unstable_track('outer event', currentTime, () => {
          expect(InteractionTracking.__interactionsRef.current).toBe(
            InteractionTracking.unstable_getCurrent(),
          );

          InteractionTracking.__interactionsRef.current = new Set([
            {name: 'override event'},
          ]);

          expect(InteractionTracking.unstable_getCurrent()).toMatchInteractions(
            [{name: 'override event'}],
          );
        });
      });

      it('should expose a subscriber ref to be externally manipulated', () => {
        InteractionTracking.unstable_track('outer event', currentTime, () => {
          expect(InteractionTracking.__subscriberRef).toEqual({
            current: null,
          });
        });
      });
    });
  });

  describe('enableInteractionTracking disabled', () => {
    beforeEach(() => loadModules({enableInteractionTracking: false}));

    it('should return the value of a tracked function', () => {
      expect(
        InteractionTracking.unstable_track('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      InteractionTracking.unstable_track('arbitrary', currentTime, () => {
        wrapped = InteractionTracking.unstable_wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should return null for tracked interactions', () => {
      expect(InteractionTracking.unstable_getCurrent()).toBe(null);
    });

    it('should execute tracked callbacks', done => {
      InteractionTracking.unstable_track('some event', currentTime, () => {
        expect(InteractionTracking.unstable_getCurrent()).toBe(null);

        done();
      });
    });

    it('should return the value of a clear function', () => {
      expect(InteractionTracking.unstable_clear(() => 123)).toBe(123);
    });

    it('should execute wrapped callbacks', done => {
      const wrappedCallback = InteractionTracking.unstable_wrap(() => {
        expect(InteractionTracking.unstable_getCurrent()).toBe(null);

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
