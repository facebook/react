/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('Tracking', () => {
  let SchedulerTracking;
  let ReactFeatureFlags;

  let advanceTimeBy;
  let currentTime;

  function loadModules({enableSchedulerTracking}) {
    jest.resetModules();
    jest.useFakeTimers();

    currentTime = 0;
    Date.now = jest.fn().mockImplementation(() => currentTime);

    advanceTimeBy = amount => {
      currentTime += amount;
    };

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSchedulerTracking = enableSchedulerTracking;

    SchedulerTracking = require('react-scheduler/tracking');
  }

  describe('enableSchedulerTracking enabled', () => {
    beforeEach(() => loadModules({enableSchedulerTracking: true}));

    it('should return the value of a tracked function', () => {
      expect(
        SchedulerTracking.unstable_track('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a clear function', () => {
      expect(SchedulerTracking.unstable_clear(() => 123)).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      SchedulerTracking.unstable_track('arbitrary', currentTime, () => {
        wrapped = SchedulerTracking.unstable_wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should pass arguments through to a wrapped function', done => {
      let wrapped;
      SchedulerTracking.unstable_track('arbitrary', currentTime, () => {
        wrapped = SchedulerTracking.unstable_wrap((param1, param2) => {
          expect(param1).toBe('foo');
          expect(param2).toBe('bar');
          done();
        });
      });
      wrapped('foo', 'bar');
    });

    it('should return an empty set when outside of a tracked event', () => {
      expect(SchedulerTracking.unstable_getCurrent()).toContainNoInteractions();
    });

    it('should report the tracked interaction from within the track callback', done => {
      advanceTimeBy(100);

      SchedulerTracking.unstable_track('some event', currentTime, () => {
        const interactions = SchedulerTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      });
    });

    it('should report the tracked interaction from within wrapped callbacks', done => {
      let wrappedIndirection;

      function indirection() {
        const interactions = SchedulerTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      }

      advanceTimeBy(100);

      SchedulerTracking.unstable_track('some event', currentTime, () => {
        wrappedIndirection = SchedulerTracking.unstable_wrap(indirection);
      });

      advanceTimeBy(50);

      wrappedIndirection();
    });

    it('should clear the interaction stack for tracked callbacks', () => {
      let innerTestReached = false;

      SchedulerTracking.unstable_track('outer event', currentTime, () => {
        expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        SchedulerTracking.unstable_clear(() => {
          expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions(
            [],
          );

          SchedulerTracking.unstable_track('inner event', currentTime, () => {
            expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions(
              [{name: 'inner event'}],
            );

            innerTestReached = true;
          });
        });

        expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      expect(innerTestReached).toBe(true);
    });

    it('should clear the interaction stack for wrapped callbacks', () => {
      let innerTestReached = false;
      let wrappedIndirection;

      const indirection = jest.fn(() => {
        expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        SchedulerTracking.unstable_clear(() => {
          expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions(
            [],
          );

          SchedulerTracking.unstable_track('inner event', currentTime, () => {
            expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions(
              [{name: 'inner event'}],
            );

            innerTestReached = true;
          });
        });

        expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      SchedulerTracking.unstable_track('outer event', currentTime, () => {
        wrappedIndirection = SchedulerTracking.unstable_wrap(indirection);
      });

      wrappedIndirection();

      expect(innerTestReached).toBe(true);
    });

    it('should support nested tracked events', done => {
      advanceTimeBy(100);

      let innerIndirectionTracked = false;
      let outerIndirectionTracked = false;

      function innerIndirection() {
        const interactions = SchedulerTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
          {name: 'inner event', timestamp: 150},
        ]);

        innerIndirectionTracked = true;
      }

      function outerIndirection() {
        const interactions = SchedulerTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        outerIndirectionTracked = true;
      }

      SchedulerTracking.unstable_track('outer event', currentTime, () => {
        // Verify the current tracked event
        let interactions = SchedulerTracking.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        advanceTimeBy(50);

        const wrapperOuterIndirection = SchedulerTracking.unstable_wrap(
          outerIndirection,
        );

        let wrapperInnerIndirection;
        let innerEventTracked = false;

        // Verify that a nested event is properly tracked
        SchedulerTracking.unstable_track('inner event', currentTime, () => {
          interactions = SchedulerTracking.unstable_getCurrent();
          expect(interactions).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
            {name: 'inner event', timestamp: 150},
          ]);

          // Verify that a wrapped outer callback is properly tracked
          wrapperOuterIndirection();
          expect(outerIndirectionTracked).toBe(true);

          wrapperInnerIndirection = SchedulerTracking.unstable_wrap(
            innerIndirection,
          );

          innerEventTracked = true;
        });

        expect(innerEventTracked).toBe(true);

        // Verify that the original event is restored
        interactions = SchedulerTracking.unstable_getCurrent();
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

        SchedulerTracking.unstable_track('outer event', currentTime, () => {
          expect(() => {
            SchedulerTracking.unstable_track('inner event', currentTime, () => {
              throw Error('intentional');
            });
          }).toThrow();

          expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
          ]);

          done();
        });
      });

      it('should reset state appropriately when an error occurs in a wrapped callback', done => {
        advanceTimeBy(100);

        SchedulerTracking.unstable_track('outer event', currentTime, () => {
          let wrappedCallback;

          SchedulerTracking.unstable_track('inner event', currentTime, () => {
            wrappedCallback = SchedulerTracking.unstable_wrap(() => {
              throw Error('intentional');
            });
          });

          expect(wrappedCallback).toThrow();

          expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
          ]);

          done();
        });
      });
    });

    describe('advanced integration', () => {
      it('should return a unique threadID per request', () => {
        expect(SchedulerTracking.unstable_getThreadID()).not.toBe(
          SchedulerTracking.unstable_getThreadID(),
        );
      });

      it('should expose the current set of interactions to be externally manipulated', () => {
        SchedulerTracking.unstable_track('outer event', currentTime, () => {
          expect(SchedulerTracking.__getInteractionsRef().current).toBe(
            SchedulerTracking.unstable_getCurrent(),
          );

          SchedulerTracking.__getInteractionsRef().current = new Set([
            {name: 'override event'},
          ]);

          expect(SchedulerTracking.unstable_getCurrent()).toMatchInteractions([
            {name: 'override event'},
          ]);
        });
      });

      it('should expose a subscriber ref to be externally manipulated', () => {
        SchedulerTracking.unstable_track('outer event', currentTime, () => {
          expect(SchedulerTracking.__getSubscriberRef()).toEqual({
            current: null,
          });
        });
      });
    });
  });

  describe('enableSchedulerTracking disabled', () => {
    beforeEach(() => loadModules({enableSchedulerTracking: false}));

    it('should return the value of a tracked function', () => {
      expect(
        SchedulerTracking.unstable_track('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      SchedulerTracking.unstable_track('arbitrary', currentTime, () => {
        wrapped = SchedulerTracking.unstable_wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should return null for tracked interactions', () => {
      expect(SchedulerTracking.unstable_getCurrent()).toBe(null);
    });

    it('should execute tracked callbacks', done => {
      SchedulerTracking.unstable_track('some event', currentTime, () => {
        expect(SchedulerTracking.unstable_getCurrent()).toBe(null);

        done();
      });
    });

    it('should return the value of a clear function', () => {
      expect(SchedulerTracking.unstable_clear(() => 123)).toBe(123);
    });

    it('should execute wrapped callbacks', done => {
      const wrappedCallback = SchedulerTracking.unstable_wrap(() => {
        expect(SchedulerTracking.unstable_getCurrent()).toBe(null);

        done();
      });

      wrappedCallback();
    });

    describe('advanced integration', () => {
      it('should not create unnecessary objects', () => {
        expect(SchedulerTracking.__getInteractionsRef()).toBe(null);
      });
    });
  });
});
