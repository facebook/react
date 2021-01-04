/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

describe('Tracing', () => {
  let SchedulerTracing;
  let ReactFeatureFlags;

  let advanceTimeBy;
  let currentTime;

  function loadModules({enableSchedulerTracing}) {
    jest.resetModules();
    jest.useFakeTimers();

    currentTime = 0;
    Date.now = jest.fn().mockImplementation(() => currentTime);

    advanceTimeBy = amount => {
      currentTime += amount;
    };

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSchedulerTracing = enableSchedulerTracing;

    SchedulerTracing = require('scheduler/tracing');
  }

  describe('enableSchedulerTracing enabled', () => {
    beforeEach(() => loadModules({enableSchedulerTracing: true}));

    it('should return the value of a traced function', () => {
      expect(
        SchedulerTracing.unstable_trace('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a clear function', () => {
      expect(SchedulerTracing.unstable_clear(() => 123)).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      SchedulerTracing.unstable_trace('arbitrary', currentTime, () => {
        wrapped = SchedulerTracing.unstable_wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should pass arguments through to a wrapped function', done => {
      let wrapped;
      SchedulerTracing.unstable_trace('arbitrary', currentTime, () => {
        wrapped = SchedulerTracing.unstable_wrap((param1, param2) => {
          expect(param1).toBe('foo');
          expect(param2).toBe('bar');
          done();
        });
      });
      wrapped('foo', 'bar');
    });

    it('should return an empty set when outside of a traced event', () => {
      expect(SchedulerTracing.unstable_getCurrent()).toContainNoInteractions();
    });

    it('should report the traced interaction from within the trace callback', done => {
      advanceTimeBy(100);

      SchedulerTracing.unstable_trace('some event', currentTime, () => {
        const interactions = SchedulerTracing.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      });
    });

    it('should report the traced interaction from within wrapped callbacks', done => {
      let wrappedIndirection;

      function indirection() {
        const interactions = SchedulerTracing.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'some event', timestamp: 100},
        ]);

        done();
      }

      advanceTimeBy(100);

      SchedulerTracing.unstable_trace('some event', currentTime, () => {
        wrappedIndirection = SchedulerTracing.unstable_wrap(indirection);
      });

      advanceTimeBy(50);

      wrappedIndirection();
    });

    it('should clear the interaction stack for traced callbacks', () => {
      let innerTestReached = false;

      SchedulerTracing.unstable_trace('outer event', currentTime, () => {
        expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        SchedulerTracing.unstable_clear(() => {
          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions(
            [],
          );

          SchedulerTracing.unstable_trace('inner event', currentTime, () => {
            expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
              {name: 'inner event'},
            ]);

            innerTestReached = true;
          });
        });

        expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      expect(innerTestReached).toBe(true);
    });

    it('should clear the interaction stack for wrapped callbacks', () => {
      let innerTestReached = false;
      let wrappedIndirection;

      const indirection = jest.fn(() => {
        expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);

        SchedulerTracing.unstable_clear(() => {
          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions(
            [],
          );

          SchedulerTracing.unstable_trace('inner event', currentTime, () => {
            expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
              {name: 'inner event'},
            ]);

            innerTestReached = true;
          });
        });

        expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
          {name: 'outer event'},
        ]);
      });

      SchedulerTracing.unstable_trace('outer event', currentTime, () => {
        wrappedIndirection = SchedulerTracing.unstable_wrap(indirection);
      });

      wrappedIndirection();

      expect(innerTestReached).toBe(true);
    });

    it('should support nested traced events', done => {
      advanceTimeBy(100);

      let innerIndirectionTraced = false;
      let outerIndirectionTraced = false;

      function innerIndirection() {
        const interactions = SchedulerTracing.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
          {name: 'inner event', timestamp: 150},
        ]);

        innerIndirectionTraced = true;
      }

      function outerIndirection() {
        const interactions = SchedulerTracing.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        outerIndirectionTraced = true;
      }

      SchedulerTracing.unstable_trace('outer event', currentTime, () => {
        // Verify the current traced event
        let interactions = SchedulerTracing.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        advanceTimeBy(50);

        const wrapperOuterIndirection = SchedulerTracing.unstable_wrap(
          outerIndirection,
        );

        let wrapperInnerIndirection;
        let innerEventTraced = false;

        // Verify that a nested event is properly traced
        SchedulerTracing.unstable_trace('inner event', currentTime, () => {
          interactions = SchedulerTracing.unstable_getCurrent();
          expect(interactions).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
            {name: 'inner event', timestamp: 150},
          ]);

          // Verify that a wrapped outer callback is properly traced
          wrapperOuterIndirection();
          expect(outerIndirectionTraced).toBe(true);

          wrapperInnerIndirection = SchedulerTracing.unstable_wrap(
            innerIndirection,
          );

          innerEventTraced = true;
        });

        expect(innerEventTraced).toBe(true);

        // Verify that the original event is restored
        interactions = SchedulerTracing.unstable_getCurrent();
        expect(interactions).toMatchInteractions([
          {name: 'outer event', timestamp: 100},
        ]);

        // Verify that a wrapped nested callback is properly traced
        wrapperInnerIndirection();
        expect(innerIndirectionTraced).toBe(true);

        done();
      });
    });

    describe('error handling', () => {
      it('should reset state appropriately when an error occurs in a trace callback', done => {
        advanceTimeBy(100);

        SchedulerTracing.unstable_trace('outer event', currentTime, () => {
          expect(() => {
            SchedulerTracing.unstable_trace('inner event', currentTime, () => {
              throw Error('intentional');
            });
          }).toThrow();

          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
          ]);

          done();
        });
      });

      it('should reset state appropriately when an error occurs in a wrapped callback', done => {
        advanceTimeBy(100);

        SchedulerTracing.unstable_trace('outer event', currentTime, () => {
          let wrappedCallback;

          SchedulerTracing.unstable_trace('inner event', currentTime, () => {
            wrappedCallback = SchedulerTracing.unstable_wrap(() => {
              throw Error('intentional');
            });
          });

          expect(wrappedCallback).toThrow();

          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            {name: 'outer event', timestamp: 100},
          ]);

          done();
        });
      });
    });

    describe('advanced integration', () => {
      it('should return a unique threadID per request', () => {
        expect(SchedulerTracing.unstable_getThreadID()).not.toBe(
          SchedulerTracing.unstable_getThreadID(),
        );
      });

      it('should expose the current set of interactions to be externally manipulated', () => {
        SchedulerTracing.unstable_trace('outer event', currentTime, () => {
          expect(SchedulerTracing.__interactionsRef.current).toBe(
            SchedulerTracing.unstable_getCurrent(),
          );

          SchedulerTracing.__interactionsRef.current = new Set([
            {name: 'override event'},
          ]);

          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            {name: 'override event'},
          ]);
        });
      });

      it('should expose a subscriber ref to be externally manipulated', () => {
        SchedulerTracing.unstable_trace('outer event', currentTime, () => {
          expect(SchedulerTracing.__subscriberRef).toEqual({
            current: null,
          });
        });
      });
    });
  });

  describe('enableSchedulerTracing disabled', () => {
    beforeEach(() => loadModules({enableSchedulerTracing: false}));

    it('should return the value of a traced function', () => {
      expect(
        SchedulerTracing.unstable_trace('arbitrary', currentTime, () => 123),
      ).toBe(123);
    });

    it('should return the value of a wrapped function', () => {
      let wrapped;
      SchedulerTracing.unstable_trace('arbitrary', currentTime, () => {
        wrapped = SchedulerTracing.unstable_wrap(() => 123);
      });
      expect(wrapped()).toBe(123);
    });

    it('should return null for traced interactions', () => {
      expect(SchedulerTracing.unstable_getCurrent()).toBe(null);
    });

    it('should execute traced callbacks', done => {
      SchedulerTracing.unstable_trace('some event', currentTime, () => {
        expect(SchedulerTracing.unstable_getCurrent()).toBe(null);

        done();
      });
    });

    it('should return the value of a clear function', () => {
      expect(SchedulerTracing.unstable_clear(() => 123)).toBe(123);
    });

    it('should execute wrapped callbacks', done => {
      const wrappedCallback = SchedulerTracing.unstable_wrap(() => {
        expect(SchedulerTracing.unstable_getCurrent()).toBe(null);

        done();
      });

      wrappedCallback();
    });

    describe('advanced integration', () => {
      it('should not create unnecessary objects', () => {
        expect(SchedulerTracing.__interactionsRef).toBe(null);
      });
    });
  });
});
