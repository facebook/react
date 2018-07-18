/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let ReactTestRenderer;

function loadModules({
  enableProfilerTimer = true,
  replayFailedUnitOfWorkWithInvokeGuardedCallback = false,
  useNoopRenderer = false,
} = {}) {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.debugRenderPhaseSideEffects = false;
  ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
  ReactFeatureFlags.enableProfilerTimer = enableProfilerTimer;
  ReactFeatureFlags.enableGetDerivedStateFromCatch = true;
  ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = replayFailedUnitOfWorkWithInvokeGuardedCallback;
  React = require('react');

  if (useNoopRenderer) {
    ReactNoop = require('react-noop-renderer');
  } else {
    ReactTestRenderer = require('react-test-renderer');
  }
}

const mockDevToolsForTest = () => {
  jest.mock('react-reconciler/src/ReactFiberDevToolsHook', () => ({
    injectInternals: () => {},
    onCommitRoot: () => {},
    onCommitUnmount: () => {},
    isDevToolsPresent: true,
  }));
};

describe('Profiler', () => {
  describe('works in profiling and non-profiling bundles', () => {
    [true, false].forEach(flagEnabled => {
      describe(`enableProfilerTimer ${
        flagEnabled ? 'enabled' : 'disabled'
      }`, () => {
        beforeEach(() => {
          jest.resetModules();

          loadModules({enableProfilerTimer: flagEnabled});
        });

        // This will throw in production too,
        // But the test is only interested in verifying the DEV error message.
        if (__DEV__) {
          it('should warn if required params are missing', () => {
            expect(() => {
              ReactTestRenderer.create(<React.unstable_Profiler />);
            }).toThrow(
              'Profiler must specify an "id" string and "onRender" function as props',
            );
          });
        }

        it('should support an empty Profiler (with no children)', () => {
          // As root
          expect(
            ReactTestRenderer.create(
              <React.unstable_Profiler id="label" onRender={jest.fn()} />,
            ).toJSON(),
          ).toMatchSnapshot();

          // As non-root
          expect(
            ReactTestRenderer.create(
              <div>
                <React.unstable_Profiler id="label" onRender={jest.fn()} />
              </div>,
            ).toJSON(),
          ).toMatchSnapshot();
        });

        it('should render children', () => {
          const FunctionalComponent = ({label}) => <span>{label}</span>;
          const renderer = ReactTestRenderer.create(
            <div>
              <span>outside span</span>
              <React.unstable_Profiler id="label" onRender={jest.fn()}>
                <span>inside span</span>
                <FunctionalComponent label="functional component" />
              </React.unstable_Profiler>
            </div>,
          );
          expect(renderer.toJSON()).toMatchSnapshot();
        });

        it('should support nested Profilers', () => {
          const FunctionalComponent = ({label}) => <div>{label}</div>;
          class ClassComponent extends React.Component {
            render() {
              return <block>{this.props.label}</block>;
            }
          }
          const renderer = ReactTestRenderer.create(
            <React.unstable_Profiler id="outer" onRender={jest.fn()}>
              <FunctionalComponent label="outer functional component" />
              <React.unstable_Profiler id="inner" onRender={jest.fn()}>
                <ClassComponent label="inner class component" />
                <span>inner span</span>
              </React.unstable_Profiler>
            </React.unstable_Profiler>,
          );
          expect(renderer.toJSON()).toMatchSnapshot();
        });
      });
    });
  });

  describe('onRender callback', () => {
    let AdvanceTime;
    let advanceTimeBy;
    let mockNow;

    const mockNowForTests = () => {
      let currentTime = 0;

      mockNow = jest.fn().mockImplementation(() => currentTime);

      ReactTestRenderer.unstable_setNowImplementation(mockNow);
      advanceTimeBy = amount => {
        currentTime += amount;
      };
    };

    beforeEach(() => {
      jest.resetModules();

      loadModules();
      mockNowForTests();

      AdvanceTime = class extends React.Component {
        static defaultProps = {
          byAmount: 10,
          shouldComponentUpdate: true,
        };
        shouldComponentUpdate(nextProps) {
          return nextProps.shouldComponentUpdate;
        }
        render() {
          // Simulate time passing when this component is rendered
          advanceTimeBy(this.props.byAmount);
          return this.props.children || null;
        }
      };
    });

    it('is not invoked until the commit phase', () => {
      const callback = jest.fn();

      const Yield = ({value}) => {
        ReactTestRenderer.unstable_yield(value);
        return null;
      };

      const renderer = ReactTestRenderer.create(
        <React.unstable_Profiler id="test" onRender={callback}>
          <Yield value="first" />
          <Yield value="last" />
        </React.unstable_Profiler>,
        {
          unstable_isAsync: true,
        },
      );

      // Times are logged until a render is committed.
      renderer.unstable_flushThrough(['first']);
      expect(callback).toHaveBeenCalledTimes(0);
      renderer.unstable_flushAll(['last']);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not record times for components outside of Profiler tree', () => {
      ReactTestRenderer.create(
        <div>
          <AdvanceTime />
          <AdvanceTime />
          <AdvanceTime />
          <AdvanceTime />
          <AdvanceTime />
        </div>,
      );

      // Should be called two times:
      // 1. To mark the start (resuming) of work
      // 2. To compute the update expiration time,
      // 3. To record the commit time.
      // No additional calls from ProfilerTimer are expected.
      expect(mockNow).toHaveBeenCalledTimes(3);
    });

    it('logs render times for both mount and update', () => {
      const callback = jest.fn();

      advanceTimeBy(5); // 0 -> 5

      const renderer = ReactTestRenderer.create(
        <React.unstable_Profiler id="test" onRender={callback}>
          <AdvanceTime />
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      let [call] = callback.mock.calls;

      expect(call).toHaveLength(6);
      expect(call[0]).toBe('test');
      expect(call[1]).toBe('mount');
      expect(call[2]).toBe(10); // actual time
      expect(call[3]).toBe(10); // base time
      expect(call[4]).toBe(5); // start time
      expect(call[5]).toBe(15); // commit time

      callback.mockReset();

      advanceTimeBy(20); // 15 -> 35

      renderer.update(
        <React.unstable_Profiler id="test" onRender={callback}>
          <AdvanceTime />
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      [call] = callback.mock.calls;

      expect(call).toHaveLength(6);
      expect(call[0]).toBe('test');
      expect(call[1]).toBe('update');
      expect(call[2]).toBe(10); // actual time
      expect(call[3]).toBe(10); // base time
      expect(call[4]).toBe(35); // start time
      expect(call[5]).toBe(45); // commit time

      callback.mockReset();

      advanceTimeBy(20); // 45 -> 65

      renderer.update(
        <React.unstable_Profiler id="test" onRender={callback}>
          <AdvanceTime byAmount={4} />
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      [call] = callback.mock.calls;

      expect(call).toHaveLength(6);
      expect(call[0]).toBe('test');
      expect(call[1]).toBe('update');
      expect(call[2]).toBe(4); // actual time
      expect(call[3]).toBe(4); // base time
      expect(call[4]).toBe(65); // start time
      expect(call[5]).toBe(69); // commit time
    });

    it('includes render times of nested Profilers in their parent times', () => {
      const callback = jest.fn();

      advanceTimeBy(5); // 0 -> 5

      ReactTestRenderer.create(
        <React.Fragment>
          <React.unstable_Profiler id="parent" onRender={callback}>
            <AdvanceTime byAmount={10}>
              <React.unstable_Profiler id="child" onRender={callback}>
                <AdvanceTime byAmount={20} />
              </React.unstable_Profiler>
            </AdvanceTime>
          </React.unstable_Profiler>
        </React.Fragment>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      // Callbacks bubble (reverse order).
      const [childCall, parentCall] = callback.mock.calls;
      expect(childCall[0]).toBe('child');
      expect(parentCall[0]).toBe('parent');

      // Parent times should include child times
      expect(childCall[2]).toBe(20); // actual time
      expect(childCall[3]).toBe(20); // base time
      expect(childCall[4]).toBe(15); // start time
      expect(childCall[5]).toBe(35); // commit time
      expect(parentCall[2]).toBe(30); // actual time
      expect(parentCall[3]).toBe(30); // base time
      expect(parentCall[4]).toBe(5); // start time
      expect(parentCall[5]).toBe(35); // commit time
    });

    it('tracks sibling Profilers separately', () => {
      const callback = jest.fn();

      advanceTimeBy(5); // 0 -> 5

      ReactTestRenderer.create(
        <React.Fragment>
          <React.unstable_Profiler id="first" onRender={callback}>
            <AdvanceTime byAmount={20} />
          </React.unstable_Profiler>
          <React.unstable_Profiler id="second" onRender={callback}>
            <AdvanceTime byAmount={5} />
          </React.unstable_Profiler>
        </React.Fragment>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      const [firstCall, secondCall] = callback.mock.calls;
      expect(firstCall[0]).toBe('first');
      expect(secondCall[0]).toBe('second');

      // Parent times should include child times
      expect(firstCall[2]).toBe(20); // actual time
      expect(firstCall[3]).toBe(20); // base time
      expect(firstCall[4]).toBe(5); // start time
      expect(firstCall[5]).toBe(30); // commit time
      expect(secondCall[2]).toBe(5); // actual time
      expect(secondCall[3]).toBe(5); // base time
      expect(secondCall[4]).toBe(25); // start time
      expect(secondCall[5]).toBe(30); // commit time
    });

    it('does not include time spent outside of profile root', () => {
      const callback = jest.fn();

      advanceTimeBy(5); // 0 -> 5

      ReactTestRenderer.create(
        <React.Fragment>
          <AdvanceTime byAmount={20} />
          <React.unstable_Profiler id="test" onRender={callback}>
            <AdvanceTime byAmount={5} />
          </React.unstable_Profiler>
          <AdvanceTime byAmount={20} />
        </React.Fragment>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      const [call] = callback.mock.calls;
      expect(call[0]).toBe('test');
      expect(call[2]).toBe(5); // actual time
      expect(call[3]).toBe(5); // base time
      expect(call[4]).toBe(25); // start time
      expect(call[5]).toBe(50); // commit time
    });

    it('is not called when blocked by sCU false', () => {
      const callback = jest.fn();

      let instance;
      class Updater extends React.Component {
        state = {};
        render() {
          instance = this;
          return this.props.children;
        }
      }

      class Pure extends React.PureComponent {
        render() {
          return this.props.children;
        }
      }

      const renderer = ReactTestRenderer.create(
        <React.unstable_Profiler id="outer" onRender={callback}>
          <Updater>
            <React.unstable_Profiler id="middle" onRender={callback}>
              <Pure>
                <React.unstable_Profiler id="inner" onRender={callback}>
                  <div />
                </React.unstable_Profiler>
              </Pure>
            </React.unstable_Profiler>
          </Updater>
        </React.unstable_Profiler>,
      );

      // All profile callbacks are called for initial render
      expect(callback).toHaveBeenCalledTimes(3);

      callback.mockReset();

      renderer.unstable_flushSync(() => {
        instance.setState({
          count: 1,
        });
      });

      // Only call profile updates for paths that have re-rendered
      // Since "inner" is beneath a pure compoent, it isn't called
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][0]).toBe('middle');
      expect(callback.mock.calls[1][0]).toBe('outer');
    });

    it('decreases actual time but not base time when sCU prevents an update', () => {
      const callback = jest.fn();

      advanceTimeBy(5); // 0 -> 5

      const renderer = ReactTestRenderer.create(
        <React.unstable_Profiler id="test" onRender={callback}>
          <AdvanceTime byAmount={10}>
            <AdvanceTime byAmount={10} shouldComponentUpdate={false} />
          </AdvanceTime>
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      advanceTimeBy(30); // 25 -> 55

      renderer.update(
        <React.unstable_Profiler id="test" onRender={callback}>
          <AdvanceTime byAmount={10}>
            <AdvanceTime byAmount={10} shouldComponentUpdate={false} />
          </AdvanceTime>
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      const [mountCall, updateCall] = callback.mock.calls;

      expect(mountCall[1]).toBe('mount');
      expect(mountCall[2]).toBe(20); // actual time
      expect(mountCall[3]).toBe(20); // base time
      expect(mountCall[4]).toBe(5); // start time
      expect(mountCall[5]).toBe(25); // commit time

      expect(updateCall[1]).toBe('update');
      expect(updateCall[2]).toBe(10); // actual time
      expect(updateCall[3]).toBe(20); // base time
      expect(updateCall[4]).toBe(55); // start time
      expect(updateCall[5]).toBe(65); // commit time
    });

    it('includes time spent in render phase lifecycles', () => {
      class WithLifecycles extends React.Component {
        state = {};
        static getDerivedStateFromProps() {
          advanceTimeBy(3);
          return null;
        }
        shouldComponentUpdate() {
          advanceTimeBy(7);
          return true;
        }
        render() {
          advanceTimeBy(5);
          return null;
        }
      }

      const callback = jest.fn();

      advanceTimeBy(5); // 0 -> 5

      const renderer = ReactTestRenderer.create(
        <React.unstable_Profiler id="test" onRender={callback}>
          <WithLifecycles />
        </React.unstable_Profiler>,
      );

      advanceTimeBy(15); // 13 -> 28

      renderer.update(
        <React.unstable_Profiler id="test" onRender={callback}>
          <WithLifecycles />
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      const [mountCall, updateCall] = callback.mock.calls;

      expect(mountCall[1]).toBe('mount');
      expect(mountCall[2]).toBe(8); // actual time
      expect(mountCall[3]).toBe(8); // base time
      expect(mountCall[4]).toBe(5); // start time
      expect(mountCall[5]).toBe(13); // commit time

      expect(updateCall[1]).toBe('update');
      expect(updateCall[2]).toBe(15); // actual time
      expect(updateCall[3]).toBe(15); // base time
      expect(updateCall[4]).toBe(28); // start time
      expect(updateCall[5]).toBe(43); // commit time
    });

    describe('with regard to interruptions', () => {
      it('should accumulate actual time after a scheduling interruptions', () => {
        const callback = jest.fn();

        const Yield = ({renderTime}) => {
          advanceTimeBy(renderTime);
          ReactTestRenderer.unstable_yield('Yield:' + renderTime);
          return null;
        };

        advanceTimeBy(5); // 0 -> 5

        // Render partially, but run out of time before completing.
        const renderer = ReactTestRenderer.create(
          <React.unstable_Profiler id="test" onRender={callback}>
            <Yield renderTime={2} />
            <Yield renderTime={3} />
          </React.unstable_Profiler>,
          {unstable_isAsync: true},
        );
        expect(renderer.unstable_flushThrough(['Yield:2'])).toEqual([
          'Yield:2',
        ]);
        expect(callback).toHaveBeenCalledTimes(0);

        // Resume render for remaining children.
        renderer.unstable_flushAll(['Yield:3']);

        // Verify that logged times include both durations above.
        expect(callback).toHaveBeenCalledTimes(1);
        const [call] = callback.mock.calls;
        expect(call[2]).toBe(5); // actual time
        expect(call[3]).toBe(5); // base time
        expect(call[4]).toBe(5); // start time
        expect(call[5]).toBe(10); // commit time
      });

      it('should not include time between frames', () => {
        const callback = jest.fn();

        const Yield = ({renderTime}) => {
          advanceTimeBy(renderTime);
          ReactTestRenderer.unstable_yield('Yield:' + renderTime);
          return null;
        };

        advanceTimeBy(5); // 0 -> 5

        // Render partially, but don't finish.
        // This partial render should take 5ms of simulated time.
        const renderer = ReactTestRenderer.create(
          <React.unstable_Profiler id="outer" onRender={callback}>
            <Yield renderTime={5} />
            <Yield renderTime={10} />
            <React.unstable_Profiler id="inner" onRender={callback}>
              <Yield renderTime={17} />
            </React.unstable_Profiler>
          </React.unstable_Profiler>,
          {unstable_isAsync: true},
        );
        expect(renderer.unstable_flushThrough(['Yield:5'])).toEqual([
          'Yield:5',
        ]);
        expect(callback).toHaveBeenCalledTimes(0);

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(50); // 10 -> 60

        // Flush the remaninig work,
        // Which should take an additional 10ms of simulated time.
        renderer.unstable_flushAll(['Yield:10', 'Yield:17']);
        expect(callback).toHaveBeenCalledTimes(2);

        const [innerCall, outerCall] = callback.mock.calls;

        // Verify that the actual time includes all work times,
        // But not the time that elapsed between frames.
        expect(innerCall[0]).toBe('inner');
        expect(innerCall[2]).toBe(17); // actual time
        expect(innerCall[3]).toBe(17); // base time
        expect(innerCall[4]).toBe(70); // start time
        expect(innerCall[5]).toBe(87); // commit time
        expect(outerCall[0]).toBe('outer');
        expect(outerCall[2]).toBe(32); // actual time
        expect(outerCall[3]).toBe(32); // base time
        expect(outerCall[4]).toBe(5); // start time
        expect(outerCall[5]).toBe(87); // commit time
      });

      it('should report the expected times when a high-priority update replaces an in-progress initial render', () => {
        const callback = jest.fn();

        const Yield = ({renderTime}) => {
          advanceTimeBy(renderTime);
          ReactTestRenderer.unstable_yield('Yield:' + renderTime);
          return null;
        };

        advanceTimeBy(5); // 0 -> 5

        // Render a partially update, but don't finish.
        // This partial render should take 10ms of simulated time.
        const renderer = ReactTestRenderer.create(
          <React.unstable_Profiler id="test" onRender={callback}>
            <Yield renderTime={10} />
            <Yield renderTime={20} />
          </React.unstable_Profiler>,
          {unstable_isAsync: true},
        );
        expect(renderer.unstable_flushThrough(['Yield:10'])).toEqual([
          'Yield:10',
        ]);
        expect(callback).toHaveBeenCalledTimes(0);

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(100); // 15 -> 115

        // Interrupt with higher priority work.
        // The interrupted work simulates an additional 5ms of time.
        renderer.unstable_flushSync(() => {
          renderer.update(
            <React.unstable_Profiler id="test" onRender={callback}>
              <Yield renderTime={5} />
            </React.unstable_Profiler>,
          );
        });
        expect(ReactTestRenderer.unstable_clearYields()).toEqual(['Yield:5']);

        // The initial work was thrown away in this case,
        // So the actual and base times should only include the final rendered tree times.
        expect(callback).toHaveBeenCalledTimes(1);
        let call = callback.mock.calls[0];
        expect(call[2]).toBe(5); // actual time
        expect(call[3]).toBe(5); // base time
        expect(call[4]).toBe(115); // start time
        expect(call[5]).toBe(120); // commit time

        callback.mockReset();

        // Verify no more unexpected callbacks from low priority work
        renderer.unstable_flushAll([]);
        expect(callback).toHaveBeenCalledTimes(0);
      });

      it('should report the expected times when a high-priority update replaces a low-priority update', () => {
        const callback = jest.fn();

        const Yield = ({renderTime}) => {
          advanceTimeBy(renderTime);
          ReactTestRenderer.unstable_yield('Yield:' + renderTime);
          return null;
        };

        advanceTimeBy(5); // 0 -> 5

        const renderer = ReactTestRenderer.create(
          <React.unstable_Profiler id="test" onRender={callback}>
            <Yield renderTime={6} />
            <Yield renderTime={15} />
          </React.unstable_Profiler>,
          {unstable_isAsync: true},
        );

        // Render everything initially.
        // This should take 21 seconds of actual and base time.
        renderer.unstable_flushAll(['Yield:6', 'Yield:15']);
        expect(callback).toHaveBeenCalledTimes(1);
        let call = callback.mock.calls[0];
        expect(call[2]).toBe(21); // actual time
        expect(call[3]).toBe(21); // base time
        expect(call[4]).toBe(5); // start time
        expect(call[5]).toBe(26); // commit time

        callback.mockReset();

        advanceTimeBy(30); // 26 -> 56

        // Render a partially update, but don't finish.
        // This partial render should take 3ms of simulated time.
        renderer.update(
          <React.unstable_Profiler id="test" onRender={callback}>
            <Yield renderTime={3} />
            <Yield renderTime={5} />
            <Yield renderTime={9} />
          </React.unstable_Profiler>,
        );
        expect(renderer.unstable_flushThrough(['Yield:3'])).toEqual([
          'Yield:3',
        ]);
        expect(callback).toHaveBeenCalledTimes(0);

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(100); // 59 -> 159

        // Render another 5ms of simulated time.
        expect(renderer.unstable_flushThrough(['Yield:5'])).toEqual([
          'Yield:5',
        ]);
        expect(callback).toHaveBeenCalledTimes(0);

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(100); // 164 -> 264

        // Interrupt with higher priority work.
        // The interrupted work simulates an additional 11ms of time.
        renderer.unstable_flushSync(() => {
          renderer.update(
            <React.unstable_Profiler id="test" onRender={callback}>
              <Yield renderTime={11} />
            </React.unstable_Profiler>,
          );
        });
        expect(ReactTestRenderer.unstable_clearYields()).toEqual(['Yield:11']);

        // The actual time should include only the most recent render,
        // Because this lets us avoid a lot of commit phase reset complexity.
        // The base time includes only the final rendered tree times.
        expect(callback).toHaveBeenCalledTimes(1);
        call = callback.mock.calls[0];
        expect(call[2]).toBe(11); // actual time
        expect(call[3]).toBe(11); // base time
        expect(call[4]).toBe(264); // start time
        expect(call[5]).toBe(275); // commit time

        // Verify no more unexpected callbacks from low priority work
        renderer.unstable_flushAll([]);
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should report the expected times when a high-priority update interrupts a low-priority update', () => {
        const callback = jest.fn();

        const Yield = ({renderTime}) => {
          advanceTimeBy(renderTime);
          ReactTestRenderer.unstable_yield('Yield:' + renderTime);
          return null;
        };

        let first;
        class FirstComponent extends React.Component {
          state = {renderTime: 1};
          render() {
            first = this;
            advanceTimeBy(this.state.renderTime);
            ReactTestRenderer.unstable_yield(
              'FirstComponent:' + this.state.renderTime,
            );
            return <Yield renderTime={4} />;
          }
        }
        let second;
        class SecondComponent extends React.Component {
          state = {renderTime: 2};
          render() {
            second = this;
            advanceTimeBy(this.state.renderTime);
            ReactTestRenderer.unstable_yield(
              'SecondComponent:' + this.state.renderTime,
            );
            return <Yield renderTime={7} />;
          }
        }

        advanceTimeBy(5); // 0 -> 5

        const renderer = ReactTestRenderer.create(
          <React.unstable_Profiler id="test" onRender={callback} foo="1">
            <FirstComponent />
            <SecondComponent />
          </React.unstable_Profiler>,
          {unstable_isAsync: true},
        );

        // Render everything initially.
        // This simulates a total of 14ms of actual render time.
        // The base render time is also 14ms for the initial render.
        renderer.unstable_flushAll([
          'FirstComponent:1',
          'Yield:4',
          'SecondComponent:2',
          'Yield:7',
        ]);
        expect(callback).toHaveBeenCalledTimes(1);
        let call = callback.mock.calls[0];
        expect(call[2]).toBe(14); // actual time
        expect(call[3]).toBe(14); // base time
        expect(call[4]).toBe(5); // start time
        expect(call[5]).toBe(19); // commit time

        callback.mockClear();

        advanceTimeBy(100); // 19 -> 119

        // Render a partially update, but don't finish.
        // This partial render will take 10ms of actual render time.
        first.setState({renderTime: 10});
        expect(renderer.unstable_flushThrough(['FirstComponent:10'])).toEqual([
          'FirstComponent:10',
        ]);
        expect(callback).toHaveBeenCalledTimes(0);

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(100); // 129 -> 229

        // Interrupt with higher priority work.
        // This simulates a total of 37ms of actual render time.
        renderer.unstable_flushSync(() => second.setState({renderTime: 30}));
        expect(ReactTestRenderer.unstable_clearYields()).toEqual([
          'SecondComponent:30',
          'Yield:7',
        ]);

        // The actual time should include only the most recent render (37ms),
        // Because this lets us avoid a lot of commit phase reset complexity.
        // The base time should include the more recent times for the SecondComponent subtree,
        // As well as the original times for the FirstComponent subtree.
        expect(callback).toHaveBeenCalledTimes(1);
        call = callback.mock.calls[0];
        expect(call[2]).toBe(37); // actual time
        expect(call[3]).toBe(42); // base time
        expect(call[4]).toBe(229); // start time
        expect(call[5]).toBe(266); // commit time

        callback.mockClear();

        // Simulate time moving forward while frame is paused.
        advanceTimeBy(100); // 266 -> 366

        // Resume the original low priority update, with rebased state.
        // This simulates a total of 14ms of actual render time,
        // And does not include the original (interrupted) 10ms.
        // The tree contains 42ms of base render time at this point,
        // Reflecting the most recent (longer) render durations.
        // TODO: This actual time should decrease by 10ms once the scheduler supports resuming.
        renderer.unstable_flushAll(['FirstComponent:10', 'Yield:4']);
        expect(callback).toHaveBeenCalledTimes(1);
        call = callback.mock.calls[0];
        expect(call[2]).toBe(14); // actual time
        expect(call[3]).toBe(51); // base time
        expect(call[4]).toBe(366); // start time
        expect(call[5]).toBe(380); // commit time
      });

      [true, false].forEach(flagEnabled => {
        describe(`replayFailedUnitOfWorkWithInvokeGuardedCallback ${
          flagEnabled ? 'enabled' : 'disabled'
        }`, () => {
          beforeEach(() => {
            jest.resetModules();

            loadModules({
              replayFailedUnitOfWorkWithInvokeGuardedCallback: flagEnabled,
            });
            mockNowForTests();
          });

          it('should accumulate actual time after an error handled by componentDidCatch()', () => {
            const callback = jest.fn();

            const ThrowsError = () => {
              advanceTimeBy(10);
              throw Error('expected error');
            };

            class ErrorBoundary extends React.Component {
              state = {error: null};
              componentDidCatch(error) {
                this.setState({error});
              }
              render() {
                advanceTimeBy(2);
                return this.state.error === null ? (
                  this.props.children
                ) : (
                  <AdvanceTime byAmount={20} />
                );
              }
            }

            advanceTimeBy(5); // 0 -> 5

            ReactTestRenderer.create(
              <React.unstable_Profiler id="test" onRender={callback}>
                <ErrorBoundary>
                  <AdvanceTime byAmount={5} />
                  <ThrowsError />
                </ErrorBoundary>
              </React.unstable_Profiler>,
            );

            expect(callback).toHaveBeenCalledTimes(2);

            // Callbacks bubble (reverse order).
            let [mountCall, updateCall] = callback.mock.calls;

            // The initial mount only includes the ErrorBoundary (which takes 2ms)
            // But it spends time rendering all of the failed subtree also.
            expect(mountCall[1]).toBe('mount');
            // actual time includes: 2 (ErrorBoundary) + 5 (AdvanceTime) + 10 (ThrowsError)
            // If replayFailedUnitOfWorkWithInvokeGuardedCallback is enbaled, ThrowsError is replayed.
            expect(mountCall[2]).toBe(flagEnabled && __DEV__ ? 27 : 17);
            // base time includes: 2 (ErrorBoundary)
            expect(mountCall[3]).toBe(2);
            // start time
            expect(mountCall[4]).toBe(5);
            // commit time
            expect(mountCall[5]).toBe(flagEnabled && __DEV__ ? 32 : 22);

            // The update includes the ErrorBoundary and its fallback child
            expect(updateCall[1]).toBe('update');
            // actual time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
            expect(updateCall[2]).toBe(22);
            // base time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
            expect(updateCall[3]).toBe(22);
            // start time
            expect(updateCall[4]).toBe(flagEnabled && __DEV__ ? 32 : 22);
            // commit time
            expect(updateCall[5]).toBe(flagEnabled && __DEV__ ? 54 : 44);
          });

          it('should accumulate actual time after an error handled by getDerivedStateFromCatch()', () => {
            const callback = jest.fn();

            const ThrowsError = () => {
              advanceTimeBy(10);
              throw Error('expected error');
            };

            class ErrorBoundary extends React.Component {
              state = {error: null};
              static getDerivedStateFromCatch(error) {
                return {error};
              }
              render() {
                advanceTimeBy(2);
                return this.state.error === null ? (
                  this.props.children
                ) : (
                  <AdvanceTime byAmount={20} />
                );
              }
            }

            advanceTimeBy(5); // 0 -> 5

            ReactTestRenderer.create(
              <React.unstable_Profiler id="test" onRender={callback}>
                <ErrorBoundary>
                  <AdvanceTime byAmount={5} />
                  <ThrowsError />
                </ErrorBoundary>
              </React.unstable_Profiler>,
            );

            expect(callback).toHaveBeenCalledTimes(1);

            // Callbacks bubble (reverse order).
            let [mountCall] = callback.mock.calls;

            // The initial mount includes the ErrorBoundary's error state,
            // But i also spends actual time rendering UI that fails and isn't included.
            expect(mountCall[1]).toBe('mount');
            // actual time includes: 2 (ErrorBoundary) + 5 (AdvanceTime) + 10 (ThrowsError)
            // Then the re-render: 2 (ErrorBoundary) + 20 (AdvanceTime)
            // If replayFailedUnitOfWorkWithInvokeGuardedCallback is enbaled, ThrowsError is replayed.
            expect(mountCall[2]).toBe(flagEnabled && __DEV__ ? 49 : 39);
            // base time includes: 2 (ErrorBoundary) + 20 (AdvanceTime)
            expect(mountCall[3]).toBe(22);
            // start time
            expect(mountCall[4]).toBe(5);
            // commit time
            expect(mountCall[5]).toBe(flagEnabled && __DEV__ ? 54 : 44);
          });

          it('should reset the fiber stack correct after a "complete" phase error', () => {
            jest.resetModules();

            loadModules({
              useNoopRenderer: true,
              replayFailedUnitOfWorkWithInvokeGuardedCallback: flagEnabled,
            });

            // Simulate a renderer error during the "complete" phase.
            // This mimics behavior like React Native's View/Text nesting validation.
            ReactNoop.render(
              <React.unstable_Profiler id="profiler" onRender={jest.fn()}>
                <errorInCompletePhase>hi</errorInCompletePhase>
              </React.unstable_Profiler>,
            );
            expect(ReactNoop.flush).toThrow('Error in host config.');

            // So long as the profiler timer's fiber stack is reset correctly,
            // Subsequent renders should not error.
            ReactNoop.render(
              <React.unstable_Profiler id="profiler" onRender={jest.fn()}>
                <span>hi</span>
              </React.unstable_Profiler>,
            );
            ReactNoop.flush();
          });
        });
      });
    });

    it('reflects the most recently rendered id value', () => {
      const callback = jest.fn();

      advanceTimeBy(5); // 0 -> 5

      const renderer = ReactTestRenderer.create(
        <React.unstable_Profiler id="one" onRender={callback}>
          <AdvanceTime byAmount={2} />
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(1);

      advanceTimeBy(20); // 7 -> 27

      renderer.update(
        <React.unstable_Profiler id="two" onRender={callback}>
          <AdvanceTime byAmount={1} />
        </React.unstable_Profiler>,
      );

      expect(callback).toHaveBeenCalledTimes(2);

      const [mountCall, updateCall] = callback.mock.calls;

      expect(mountCall[0]).toBe('one');
      expect(mountCall[1]).toBe('mount');
      expect(mountCall[2]).toBe(2); // actual time
      expect(mountCall[3]).toBe(2); // base time
      expect(mountCall[4]).toBe(5); // start time

      expect(updateCall[0]).toBe('two');
      expect(updateCall[1]).toBe('update');
      expect(updateCall[2]).toBe(1); // actual time
      expect(updateCall[3]).toBe(1); // base time
      expect(updateCall[4]).toBe(27); // start time
    });
  });

  it('should handle interleaved async yields and batched commits', () => {
    jest.resetModules();
    mockDevToolsForTest();
    loadModules({useNoopRenderer: true});

    const Child = ({duration, id}) => {
      ReactNoop.advanceTime(duration);
      ReactNoop.yield(`Child:render:${id}`);
      return null;
    };

    class Parent extends React.Component {
      componentDidMount() {
        ReactNoop.yield(`Parent:componentDidMount:${this.props.id}`);
      }
      render() {
        const {duration, id} = this.props;
        return (
          <React.Fragment>
            <Child duration={duration} id={id} />
            <Child duration={duration} id={id} />
          </React.Fragment>
        );
      }
    }

    ReactNoop.advanceTime(50);

    ReactNoop.renderToRootWithID(<Parent duration={3} id="one" />, 'one');

    // Process up to the <Parent> component, but yield before committing.
    // This ensures that the profiler timer still has paused fibers.
    const commitFirstRender = ReactNoop.flushWithoutCommitting(
      ['Child:render:one', 'Child:render:one'],
      'one',
    );

    expect(ReactNoop.getRoot('one').current.actualDuration).toBe(0);

    ReactNoop.advanceTime(100);

    // Process some async work, but yield before committing it.
    ReactNoop.renderToRootWithID(<Parent duration={7} id="two" />, 'two');
    ReactNoop.flushThrough(['Child:render:two']);

    ReactNoop.advanceTime(150);

    // Commit the previously paused, batched work.
    commitFirstRender(['Parent:componentDidMount:one']);

    expect(ReactNoop.getRoot('one').current.actualDuration).toBe(6);
    expect(ReactNoop.getRoot('two').current.actualDuration).toBe(0);

    ReactNoop.advanceTime(200);

    ReactNoop.flush();

    expect(ReactNoop.getRoot('two').current.actualDuration).toBe(14);
  });
});
